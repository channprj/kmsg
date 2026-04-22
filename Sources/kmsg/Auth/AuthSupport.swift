import Foundation

enum AuthBootstrap {
    @discardableResult
    static func requireAuthenticated(traceAX: Bool) throws -> KakaoTalkApp {
        let kakao = try KakaoTalkApp()
        let runner = AXActionRunner(traceEnabled: traceAX)
        let authenticator = KakaoTalkAuthenticator(kakao: kakao, runner: runner)
        _ = try authenticator.ensureAuthenticated(
            using: CredentialStore.shared,
            mode: .automaticIfNeeded
        )
        return kakao
    }
}
