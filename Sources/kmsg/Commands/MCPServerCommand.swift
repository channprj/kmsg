import ArgumentParser
import Darwin
import Foundation

private typealias JSONDict = [String: Any]

private struct MCPCommandResult {
    let returncode: Int32
    let stdout: String
    let stderr: String
    let latencyMs: Int
    let timedOut: Bool
}

private struct KmsgMCPError: Error, @unchecked Sendable {
    let code: Int
    let message: String
    let data: JSONDict

    init(code: Int, message: String, data: JSONDict = [:]) {
        self.code = code
        self.message = message
        self.data = data
    }
}

private final class KmsgSubprocessRunner {
    let executablePath: String

    init() {
        if let bundlePath = Bundle.main.executablePath, !bundlePath.isEmpty {
            executablePath = bundlePath
        } else {
            executablePath = CommandLine.arguments[0]
        }
    }

    func run(_ arguments: [String], timeoutSec: TimeInterval) -> MCPCommandResult {
        let start = Date()
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executablePath)
        process.arguments = arguments

        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        do {
            try process.run()
        } catch {
            return MCPCommandResult(
                returncode: 127,
                stdout: "",
                stderr: String(describing: error),
                latencyMs: Int(Date().timeIntervalSince(start) * 1000),
                timedOut: false
            )
        }

        let waitSemaphore = DispatchSemaphore(value: 0)
        DispatchQueue.global().async {
            process.waitUntilExit()
            waitSemaphore.signal()
        }

        let timedOut = waitSemaphore.wait(timeout: .now() + timeoutSec) == .timedOut
        if timedOut {
            process.terminate()

            let terminateSemaphore = DispatchSemaphore(value: 0)
            DispatchQueue.global().async {
                process.waitUntilExit()
                terminateSemaphore.signal()
            }

            if terminateSemaphore.wait(timeout: .now() + 0.5) == .timedOut {
                kill(process.processIdentifier, SIGKILL)
                process.waitUntilExit()
            }
        }

        let stdout = String(decoding: stdoutPipe.fileHandleForReading.readDataToEndOfFile(), as: UTF8.self)
        let stderr = String(decoding: stderrPipe.fileHandleForReading.readDataToEndOfFile(), as: UTF8.self)

        return MCPCommandResult(
            returncode: process.terminationStatus,
            stdout: stdout,
            stderr: stderr,
            latencyMs: Int(Date().timeIntervalSince(start) * 1000),
            timedOut: timedOut
        )
    }

    func checkReady() -> (Bool, JSONDict) {
        let version = run(["--version"], timeoutSec: 2.0)
        if version.returncode != 0 {
            return (
                false,
                [
                    "stage": "version",
                    "message": "kmsg binary not executable",
                    "stdout": version.stdout,
                    "stderr": version.stderr,
                    "kmsg_bin": executablePath,
                ]
            )
        }

        let status = run(["status"], timeoutSec: 4.0)
        if status.returncode != 0 {
            return (
                false,
                [
                    "stage": "status",
                    "message": "kmsg status check failed",
                    "stdout": status.stdout,
                    "stderr": status.stderr,
                    "kmsg_bin": executablePath,
                ]
            )
        }

        return (
            true,
            [
                "kmsg_bin": executablePath,
                "version": version.stdout.trimmingCharacters(in: .whitespacesAndNewlines),
            ]
        )
    }
}

private final class KmsgMCPServer {
    private let protocolVersion = "2024-11-05"
    private let runner = KmsgSubprocessRunner()
    private let deepRecoveryDefault: Bool
    private let traceDefault: Bool
    private let serverVersion: String
    private var initialized = false
    private var shutdown = false

    init() {
        let env = ProcessInfo.processInfo.environment
        deepRecoveryDefault = (env["KMSG_DEFAULT_DEEP_RECOVERY"] ?? "false").lowercased() == "true"
        traceDefault = (env["KMSG_TRACE_DEFAULT"] ?? "false").lowercased() == "true"
        serverVersion = env["KMSG_MCP_VERSION"]?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
            ? env["KMSG_MCP_VERSION"]!.trimmingCharacters(in: .whitespacesAndNewlines)
            : BuildVersion.current
    }

    func serveForever() throws {
        while !shutdown {
            guard let request = readMessage() else { break }
            guard request["method"] != nil else { continue }

            let requestID = request["id"]
            do {
                if let response = try handleRequest(request) {
                    try writeMessage(response)
                }
            } catch let error as KmsgMCPError {
                guard let requestID else { continue }
                try writeMessage(jsonRPCError(id: requestID, code: error.code, message: error.message, data: error.data))
            } catch {
                guard let requestID else { continue }
                try writeMessage(
                    jsonRPCError(
                        id: requestID,
                        code: -32000,
                        message: "Internal server error",
                        data: ["detail": String(describing: error)]
                    )
                )
            }
        }
    }

    private func handleRequest(_ request: JSONDict) throws -> JSONDict? {
        let method = request["method"] as? String
        let requestID = request["id"] ?? NSNull()

        switch method {
        case "initialize":
            initialized = true
            let (ready, detail) = runner.checkReady()
            var startupCheck = detail
            if !ready {
                startupCheck["note"] = "MCP server started, but kmsg readiness check failed"
            }
            return jsonRPCResult(
                id: requestID,
                result: [
                    "protocolVersion": protocolVersion,
                    "capabilities": [
                        "tools": JSONDict(),
                    ],
                    "serverInfo": [
                        "name": "openclaw-kmsg-mcp",
                        "version": serverVersion,
                    ],
                    "instructions": "Use kmsg_read for read-only operations. Use kmsg_send and kmsg_send_image with confirm=false (or omitted) for sending. Use confirm=true to intentionally require a confirmation step.",
                    "meta": [
                        "startup_check": startupCheck,
                    ],
                ]
            )

        case "notifications/initialized":
            return nil

        case "ping":
            return jsonRPCResult(id: requestID, result: JSONDict())

        case "tools/list":
            try ensureInitialized()
            return jsonRPCResult(id: requestID, result: ["tools": toolDefinitions()])

        case "tools/call":
            try ensureInitialized()
            let params = request["params"] as? JSONDict ?? [:]
            let result = try handleToolsCall(params)
            return jsonRPCResult(id: requestID, result: result)

        case "shutdown":
            try ensureInitialized()
            shutdown = true
            return jsonRPCResult(id: requestID, result: JSONDict())

        case "exit":
            shutdown = true
            return nil

        default:
            throw KmsgMCPError(code: -32601, message: "Method not found: \(method ?? "")")
        }
    }

    private func ensureInitialized() throws {
        if !initialized {
            throw KmsgMCPError(code: -32002, message: "Server not initialized")
        }
    }

    private func toolDefinitions() -> [[String: Any]] {
        [
            [
                "name": "kmsg_read",
                "description": "Read recent KakaoTalk messages from a chat via kmsg.",
                "inputSchema": [
                    "type": "object",
                    "properties": [
                        "chat": ["type": "string", "description": "Chat room or user name"],
                        "limit": ["type": "integer", "minimum": 1, "maximum": 100, "default": 20],
                        "deep_recovery": [
                            "type": "boolean",
                            "default": deepRecoveryDefault,
                            "description": "Enable deep recovery mode for window resolution",
                        ],
                        "keep_window": [
                            "type": "boolean",
                            "default": false,
                            "description": "Keep auto-opened KakaoTalk window",
                        ],
                        "trace_ax": [
                            "type": "boolean",
                            "default": traceDefault,
                            "description": "Include AX tracing logs",
                        ],
                    ],
                    "required": ["chat"],
                    "additionalProperties": false,
                ],
            ],
            [
                "name": "kmsg_send",
                "description": "Send a KakaoTalk message via kmsg. Default sends immediately; confirm=true triggers confirmation-required response.",
                "inputSchema": [
                    "type": "object",
                    "properties": [
                        "chat": ["type": "string", "description": "Chat room or user name"],
                        "message": ["type": "string", "description": "Message body"],
                        "confirm": [
                            "type": "boolean",
                            "default": false,
                            "description": "If true, do not send and return CONFIRMATION_REQUIRED",
                        ],
                        "deep_recovery": [
                            "type": "boolean",
                            "default": deepRecoveryDefault,
                            "description": "Enable deep recovery mode for window resolution",
                        ],
                        "keep_window": [
                            "type": "boolean",
                            "default": false,
                            "description": "Keep auto-opened KakaoTalk window",
                        ],
                        "trace_ax": [
                            "type": "boolean",
                            "default": traceDefault,
                            "description": "Include AX tracing logs",
                        ],
                    ],
                    "required": ["chat", "message"],
                    "additionalProperties": false,
                ],
            ],
            [
                "name": "kmsg_send_image",
                "description": "Send an image to a KakaoTalk chat via kmsg. Default sends immediately; confirm=true triggers confirmation-required response.",
                "inputSchema": [
                    "type": "object",
                    "properties": [
                        "chat": ["type": "string", "description": "Chat room or user name"],
                        "image_path": ["type": "string", "description": "Path to the image file"],
                        "confirm": [
                            "type": "boolean",
                            "default": false,
                            "description": "If true, do not send and return CONFIRMATION_REQUIRED",
                        ],
                        "deep_recovery": [
                            "type": "boolean",
                            "default": deepRecoveryDefault,
                            "description": "Enable deep recovery mode for window resolution",
                        ],
                        "keep_window": [
                            "type": "boolean",
                            "default": false,
                            "description": "Keep auto-opened KakaoTalk window",
                        ],
                        "trace_ax": [
                            "type": "boolean",
                            "default": traceDefault,
                            "description": "Include AX tracing logs",
                        ],
                    ],
                    "required": ["chat", "image_path"],
                    "additionalProperties": false,
                ],
            ],
        ]
    }

    private func handleToolsCall(_ params: JSONDict) throws -> JSONDict {
        let name = params["name"] as? String ?? ""
        let arguments = params["arguments"] as? JSONDict ?? [:]

        let resultObject: JSONDict
        switch name {
        case "kmsg_read":
            resultObject = callKmsgRead(arguments)
        case "kmsg_send":
            resultObject = callKmsgSend(arguments)
        case "kmsg_send_image":
            resultObject = callKmsgSendImage(arguments)
        default:
            throw KmsgMCPError(code: -32601, message: "Unknown tool: \(name)")
        }

        return [
            "content": [["type": "text", "text": prettyJSONString(resultObject)]],
            "isError": !(resultObject["ok"] as? Bool ?? false),
            "structuredContent": resultObject,
        ]
    }

    private func callKmsgRead(_ arguments: JSONDict) -> JSONDict {
        let chat = String(describing: arguments["chat"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if chat.isEmpty {
            return errorPayload(
                code: "INVALID_ARGUMENT",
                message: "chat is required",
                hint: "Provide a non-empty chat name.",
                rawStdout: "",
                rawStderr: "",
                latencyMs: 0
            )
        }

        let rawLimit = arguments["limit"]
        let limit: Int
        if rawLimit == nil {
            limit = 20
        } else if let intValue = rawLimit as? Int {
            limit = intValue
        } else if let doubleValue = rawLimit as? Double {
            limit = Int(doubleValue)
        } else {
            return errorPayload(
                code: "INVALID_ARGUMENT",
                message: "limit must be an integer",
                hint: "Use integer range 1..100 for limit.",
                rawStdout: "",
                rawStderr: "",
                latencyMs: 0
            )
        }

        let boundedLimit = max(1, min(limit, 100))
        let deepRecovery = boolValue(arguments["deep_recovery"], defaultValue: deepRecoveryDefault)
        let keepWindow = boolValue(arguments["keep_window"], defaultValue: false)
        let traceAX = boolValue(arguments["trace_ax"], defaultValue: traceDefault)

        var command = ["read", chat, "--json", "--limit", String(boundedLimit)]
        if deepRecovery { command.append("--deep-recovery") }
        if keepWindow { command.append("--keep-window") }
        if traceAX { command.append("--trace-ax") }

        let timeoutSec = deepRecovery ? 15.0 : 8.0
        var first = runner.run(command, timeoutSec: timeoutSec)

        if first.timedOut {
            return errorPayload(
                code: "PROCESS_TIMEOUT",
                message: "kmsg read timed out",
                hint: "Increase stability (keep KakaoTalk open/focused) and retry.",
                rawStdout: first.stdout,
                rawStderr: first.stderr,
                latencyMs: first.latencyMs
            )
        }

        if first.returncode != 0 {
            let combined = "\(first.stdout)\n\(first.stderr)"
            let code = extractErrorCode(combined)
            if code == "CHAT_NOT_FOUND" && !deepRecovery {
                var retryCommand = command
                retryCommand.append("--deep-recovery")
                let retry = runner.run(retryCommand, timeoutSec: 15.0)
                if retry.returncode == 0 && !retry.timedOut {
                    first = retry
                } else {
                    let retryCode = extractErrorCode("\(retry.stdout)\n\(retry.stderr)")
                    return errorPayload(
                        code: retryCode,
                        message: "kmsg read failed after deep-recovery retry",
                        hint: mapHint(retryCode),
                        rawStdout: retry.stdout,
                        rawStderr: retry.stderr,
                        latencyMs: retry.latencyMs
                    )
                }
            } else {
                return errorPayload(
                    code: code,
                    message: "kmsg read failed",
                    hint: mapHint(code),
                    rawStdout: first.stdout,
                    rawStderr: first.stderr,
                    latencyMs: first.latencyMs
                )
            }
        }

        guard let payload = jsonObject(from: first.stdout) else {
            return errorPayload(
                code: "INVALID_JSON_OUTPUT",
                message: "kmsg returned non-JSON output for read --json",
                hint: "Run kmsg read manually and confirm JSON-only stdout.",
                rawStdout: first.stdout,
                rawStderr: first.stderr,
                latencyMs: first.latencyMs
            )
        }

        var response: JSONDict = [
            "ok": true,
            "chat": payload["chat"] ?? chat,
            "fetched_at": payload["fetched_at"] as Any,
            "count": payload["count"] ?? 0,
            "messages": payload["messages"] ?? [],
            "meta": [
                "latency_ms": first.latencyMs,
            ],
        ]
        if traceAX, !first.stderr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            var meta = response["meta"] as? JSONDict ?? [:]
            meta["stderr_trace"] = first.stderr
            response["meta"] = meta
        }
        return response
    }

    private func callKmsgSend(_ arguments: JSONDict) -> JSONDict {
        let chat = String(describing: arguments["chat"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let message = String(describing: arguments["message"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let confirm = boolValue(arguments["confirm"], defaultValue: false)

        if chat.isEmpty || message.isEmpty {
            return errorPayload(
                code: "INVALID_ARGUMENT",
                message: "chat and message are required",
                hint: "Provide both chat and message.",
                rawStdout: "",
                rawStderr: "",
                latencyMs: 0
            )
        }

        if confirm {
            return errorPayload(
                code: "CONFIRMATION_REQUIRED",
                message: "kmsg_send blocked because confirm=true requests pre-send confirmation",
                hint: "Ask user for explicit approval, then call again with confirm=false (or omit confirm).",
                rawStdout: "",
                rawStderr: "",
                latencyMs: 0
            )
        }

        let deepRecovery = boolValue(arguments["deep_recovery"], defaultValue: deepRecoveryDefault)
        let keepWindow = boolValue(arguments["keep_window"], defaultValue: false)
        let traceAX = boolValue(arguments["trace_ax"], defaultValue: traceDefault)

        var command = ["send", chat, message]
        if deepRecovery { command.append("--deep-recovery") }
        if keepWindow { command.append("--keep-window") }
        if traceAX { command.append("--trace-ax") }

        let run = runner.run(command, timeoutSec: deepRecovery ? 18.0 : 10.0)
        if run.timedOut {
            return errorPayload(
                code: "PROCESS_TIMEOUT",
                message: "kmsg send timed out",
                hint: "Retry after ensuring KakaoTalk is responsive.",
                rawStdout: run.stdout,
                rawStderr: run.stderr,
                latencyMs: run.latencyMs
            )
        }
        if run.returncode != 0 {
            let code = extractErrorCode("\(run.stdout)\n\(run.stderr)")
            return errorPayload(
                code: code,
                message: "kmsg send failed",
                hint: mapHint(code),
                rawStdout: run.stdout,
                rawStderr: run.stderr,
                latencyMs: run.latencyMs
            )
        }

        var response: JSONDict = [
            "ok": true,
            "chat": chat,
            "sent": true,
            "meta": [
                "latency_ms": run.latencyMs,
                "stdout": run.stdout,
            ],
        ]
        if traceAX, !run.stderr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            var meta = response["meta"] as? JSONDict ?? [:]
            meta["stderr_trace"] = run.stderr
            response["meta"] = meta
        }
        return response
    }

    private func callKmsgSendImage(_ arguments: JSONDict) -> JSONDict {
        let chat = String(describing: arguments["chat"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let imagePath = String(describing: arguments["image_path"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let confirm = boolValue(arguments["confirm"], defaultValue: false)

        if chat.isEmpty || imagePath.isEmpty {
            return errorPayload(
                code: "INVALID_ARGUMENT",
                message: "chat and image_path are required",
                hint: "Provide both chat and image_path.",
                rawStdout: "",
                rawStderr: "",
                latencyMs: 0
            )
        }

        if confirm {
            return errorPayload(
                code: "CONFIRMATION_REQUIRED",
                message: "kmsg_send_image blocked because confirm=true requests pre-send confirmation",
                hint: "Ask user for explicit approval, then call again with confirm=false (or omit confirm).",
                rawStdout: "",
                rawStderr: "",
                latencyMs: 0
            )
        }

        if !FileManager.default.fileExists(atPath: imagePath) {
            return errorPayload(
                code: "INVALID_ARGUMENT",
                message: "image_path must point to an existing file",
                hint: "Provide a valid local image file path.",
                rawStdout: "",
                rawStderr: "",
                latencyMs: 0
            )
        }

        let deepRecovery = boolValue(arguments["deep_recovery"], defaultValue: deepRecoveryDefault)
        let keepWindow = boolValue(arguments["keep_window"], defaultValue: false)
        let traceAX = boolValue(arguments["trace_ax"], defaultValue: traceDefault)

        var command = ["send-image", chat, imagePath]
        if deepRecovery { command.append("--deep-recovery") }
        if keepWindow { command.append("--keep-window") }
        if traceAX { command.append("--trace-ax") }

        let run = runner.run(command, timeoutSec: deepRecovery ? 20.0 : 12.0)
        if run.timedOut {
            return errorPayload(
                code: "PROCESS_TIMEOUT",
                message: "kmsg send-image timed out",
                hint: "Retry after ensuring KakaoTalk is responsive.",
                rawStdout: run.stdout,
                rawStderr: run.stderr,
                latencyMs: run.latencyMs
            )
        }
        if run.returncode != 0 {
            let code = extractErrorCode("\(run.stdout)\n\(run.stderr)")
            return errorPayload(
                code: code,
                message: "kmsg send-image failed",
                hint: mapHint(code),
                rawStdout: run.stdout,
                rawStderr: run.stderr,
                latencyMs: run.latencyMs
            )
        }

        var response: JSONDict = [
            "ok": true,
            "chat": chat,
            "sent": true,
            "meta": [
                "latency_ms": run.latencyMs,
                "stdout": run.stdout,
            ],
        ]
        if traceAX, !run.stderr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            var meta = response["meta"] as? JSONDict ?? [:]
            meta["stderr_trace"] = run.stderr
            response["meta"] = meta
        }
        return response
    }

    private func errorPayload(
        code: String,
        message: String,
        hint: String,
        rawStdout: String,
        rawStderr: String,
        latencyMs: Int
    ) -> JSONDict {
        [
            "ok": false,
            "error": [
                "code": code,
                "message": message,
                "hint": hint,
                "raw_stdout": rawStdout,
                "raw_stderr": rawStderr,
            ],
            "meta": [
                "latency_ms": latencyMs,
            ],
        ]
    }

    private func extractErrorCode(_ combinedText: String) -> String {
        let lowered = combinedText.lowercased()
        if lowered.contains("no such file or directory") || lowered.contains("not found") {
            return "KMSG_BIN_NOT_FOUND"
        }
        if combinedText.contains("WINDOW_NOT_READY") {
            return "KAKAO_WINDOW_UNAVAILABLE"
        }
        if combinedText.contains("SEARCH_MISS") {
            return "CHAT_NOT_FOUND"
        }
        if combinedText.contains("Accessibility") || combinedText.contains("손쉬운 사용") {
            return "ACCESSIBILITY_PERMISSION_DENIED"
        }
        return "UNKNOWN_EXEC_FAILURE"
    }

    private func mapHint(_ code: String) -> String {
        switch code {
        case "KMSG_BIN_NOT_FOUND":
            return "Install kmsg and ensure the current binary is executable."
        case "KAKAO_WINDOW_UNAVAILABLE":
            return "KakaoTalk window was not ready. Open KakaoTalk and retry (or enable deep_recovery)."
        case "CHAT_NOT_FOUND":
            return "Chat was not found in search results. Verify chat name spacing and visibility."
        case "ACCESSIBILITY_PERMISSION_DENIED":
            return "Grant Accessibility permission in System Settings > Privacy & Security > Accessibility."
        default:
            return "Check raw_stdout/raw_stderr and rerun with trace_ax=true for details."
        }
    }

    private func boolValue(_ raw: Any?, defaultValue: Bool) -> Bool {
        guard let raw else { return defaultValue }
        if let bool = raw as? Bool { return bool }
        if let number = raw as? NSNumber { return number.boolValue }
        if let string = raw as? String {
            switch string.lowercased() {
            case "true", "1", "yes":
                return true
            case "false", "0", "no":
                return false
            default:
                return defaultValue
            }
        }
        return defaultValue
    }

    private func jsonObject(from string: String) -> JSONDict? {
        guard let data = string.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data),
              let dict = object as? JSONDict
        else {
            return nil
        }
        return dict
    }

    private func prettyJSONString(_ object: JSONDict) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: object, options: [.prettyPrinted, .sortedKeys]),
              let string = String(data: data, encoding: .utf8)
        else {
            return "{}"
        }
        return string
    }

    private func jsonRPCResult(id: Any, result: JSONDict) -> JSONDict {
        [
            "jsonrpc": "2.0",
            "id": id,
            "result": result,
        ]
    }

    private func jsonRPCError(id: Any, code: Int, message: String, data: JSONDict = [:]) -> JSONDict {
        var payload: JSONDict = [
            "jsonrpc": "2.0",
            "id": id,
            "error": [
                "code": code,
                "message": message,
            ],
        ]
        if !data.isEmpty {
            payload["error"] = [
                "code": code,
                "message": message,
                "data": data,
            ]
        }
        return payload
    }

    private func readMessage() -> JSONDict? {
        var headers: [String: String] = [:]

        while true {
            guard let line = readHeaderLine() else { return nil }
            if line == "\r\n" || line == "\n" {
                break
            }

            let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.isEmpty {
                continue
            }

            let parts = trimmed.split(separator: ":", maxSplits: 1)
            guard parts.count == 2 else { continue }
            headers[parts[0].trimmingCharacters(in: .whitespaces).lowercased()] = parts[1].trimmingCharacters(in: .whitespaces)
        }

        guard let lengthString = headers["content-length"],
              let contentLength = Int(lengthString),
              contentLength > 0,
              let body = readExact(contentLength)
        else {
            return nil
        }

        guard let object = try? JSONSerialization.jsonObject(with: body),
              let dict = object as? JSONDict
        else {
            return nil
        }
        return dict
    }

    private func readHeaderLine() -> String? {
        var bytes: [UInt8] = []
        while true {
            let char = getchar()
            if char == EOF {
                return bytes.isEmpty ? nil : String(decoding: bytes, as: UTF8.self)
            }
            bytes.append(UInt8(char))
            if char == 10 {
                return String(decoding: bytes, as: UTF8.self)
            }
        }
    }

    private func readExact(_ count: Int) -> Data? {
        var buffer = [UInt8](repeating: 0, count: count)
        let readCount = buffer.withUnsafeMutableBytes { rawBuffer -> Int in
            guard let baseAddress = rawBuffer.baseAddress else { return 0 }
            return fread(baseAddress, 1, count, stdin)
        }
        guard readCount == count else { return nil }
        return Data(buffer)
    }

    private func writeMessage(_ payload: JSONDict) throws {
        let encoded = try JSONSerialization.data(withJSONObject: payload, options: [])
        let header = "Content-Length: \(encoded.count)\r\n\r\n"
        header.utf8CString.withUnsafeBufferPointer { buffer in
            _ = fwrite(buffer.baseAddress, 1, buffer.count - 1, stdout)
        }
        encoded.withUnsafeBytes { rawBuffer in
            if let baseAddress = rawBuffer.baseAddress {
                _ = fwrite(baseAddress, 1, encoded.count, stdout)
            }
        }
        fflush(stdout)
    }
}

struct MCPServerCommand: ParsableCommand {
    static let configuration = CommandConfiguration(
        commandName: "mcp-server",
        abstract: "Run the stdio MCP server for kmsg integrations",
        discussion: """
            Starts the local stdio MCP server for OpenClaw and similar clients.

            Examples:
              kmsg mcp-server
              KMSG_TRACE_DEFAULT=true kmsg mcp-server
            """
    )

    func run() throws {
        let server = KmsgMCPServer()
        try server.serveForever()
    }
}
