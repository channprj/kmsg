import ApplicationServices.HIServices
import Foundation

/// A wrapper around AXUIElement providing a Swift-friendly API
public final class UIElement: @unchecked Sendable {
    public let axElement: AXUIElement

    public init(_ axElement: AXUIElement) {
        self.axElement = axElement
    }

    // MARK: - Factory Methods

    private static let defaultMessagingTimeout: TimeInterval = {
        let env = ProcessInfo.processInfo.environment["KMSG_AX_TIMEOUT"]?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if let env, let parsed = Double(env), parsed >= 0.05, parsed <= 5.0 {
            return parsed
        }
        return 0.25
    }()

    private static let configureMessagingTimeoutOnce: Void = {
        let timeout = defaultMessagingTimeout
        guard timeout > 0 else { return }
        let system = AXUIElementCreateSystemWide()
        _ = AXUIElementSetMessagingTimeout(system, Float(timeout))
    }()

    private static func configureMessagingTimeoutIfNeeded() {
        _ = configureMessagingTimeoutOnce
    }

    /// Get the system-wide UI element
    public static func systemWide() -> UIElement {
        configureMessagingTimeoutIfNeeded()
        return UIElement(AXUIElementCreateSystemWide())
    }

    /// Create a UI element for an application with the given PID
    public static func application(pid: pid_t) -> UIElement {
        configureMessagingTimeoutIfNeeded()
        let app = UIElement(AXUIElementCreateApplication(pid))
        _ = AXUIElementSetMessagingTimeout(app.axElement, Float(defaultMessagingTimeout))
        return app
    }

    // MARK: - Attributes

    /// Get an attribute value
    public func attribute<T>(_ name: String) throws -> T {
        var value: CFTypeRef?
        let error = AXUIElementCopyAttributeValue(axElement, name as CFString, &value)
        guard error == .success else {
            throw AccessibilityError.axError(error)
        }
        guard let typedValue = value as? T else {
            throw AccessibilityError.typeMismatch
        }
        return typedValue
    }

    /// Get an optional attribute value (returns nil instead of throwing for .noValue)
    public func attributeOptional<T>(_ name: String) -> T? {
        try? attribute(name)
    }

    /// Set an attribute value
    public func setAttribute(_ name: String, value: CFTypeRef) throws {
        let error = AXUIElementSetAttributeValue(axElement, name as CFString, value)
        guard error == .success else {
            throw AccessibilityError.axError(error)
        }
    }

    /// Get all attribute names
    public func attributeNames() throws -> [String] {
        var names: CFArray?
        let error = AXUIElementCopyAttributeNames(axElement, &names)
        guard error == .success else {
            throw AccessibilityError.axError(error)
        }
        return names as? [String] ?? []
    }

    // MARK: - Common Attributes

    public var role: String? {
        attributeOptional(kAXRoleAttribute)
    }

    public var roleDescription: String? {
        attributeOptional(kAXRoleDescriptionAttribute)
    }

    public var title: String? {
        attributeOptional(kAXTitleAttribute)
    }

    public var value: Any? {
        attributeOptional(kAXValueAttribute)
    }

    public var stringValue: String? {
        attributeOptional(kAXValueAttribute)
    }

    public var axDescription: String? {
        attributeOptional(kAXDescriptionAttribute)
    }

    public var identifier: String? {
        attributeOptional(kAXIdentifierAttribute)
    }

    public var isEnabled: Bool {
        attributeOptional(kAXEnabledAttribute) ?? false
    }

    public var isFocused: Bool {
        attributeOptional(kAXFocusedAttribute) ?? false
    }

    public var position: CGPoint? {
        guard let axValue: AXValue = attributeOptional(kAXPositionAttribute) else {
            return nil
        }
        var point = CGPoint.zero
        guard AXValueGetValue(axValue, .cgPoint, &point) else {
            return nil
        }
        return point
    }

    public var size: CGSize? {
        guard let axValue: AXValue = attributeOptional(kAXSizeAttribute) else {
            return nil
        }
        var size = CGSize.zero
        guard AXValueGetValue(axValue, .cgSize, &size) else {
            return nil
        }
        return size
    }

    public var frame: CGRect? {
        guard let pos = position, let size = size else {
            return nil
        }
        return CGRect(origin: pos, size: size)
    }

    public func setPosition(_ point: CGPoint) throws {
        var point = point
        guard let value = AXValueCreate(.cgPoint, &point) else {
            throw AccessibilityError.typeMismatch
        }
        try setAttribute(kAXPositionAttribute, value: value)
    }

    public func setSize(_ size: CGSize) throws {
        var size = size
        guard let value = AXValueCreate(.cgSize, &size) else {
            throw AccessibilityError.typeMismatch
        }
        try setAttribute(kAXSizeAttribute, value: value)
    }

    public func setFrame(_ frame: CGRect) throws {
        try setPosition(frame.origin)
        try setSize(frame.size)
    }

    // MARK: - Hierarchy

    public var parent: UIElement? {
        guard let axParent: AXUIElement = attributeOptional(kAXParentAttribute) else {
            return nil
        }
        return UIElement(axParent)
    }

    public var children: [UIElement] {
        guard let axChildren: [AXUIElement] = attributeOptional(kAXChildrenAttribute) else {
            return []
        }
        return axChildren.map { UIElement($0) }
    }

    public var windows: [UIElement] {
        guard let axWindows: [AXUIElement] = attributeOptional(kAXWindowsAttribute) else {
            return []
        }
        return axWindows.map { UIElement($0) }
    }

    public var focusedWindow: UIElement? {
        guard let axWindow: AXUIElement = attributeOptional(kAXFocusedWindowAttribute) else {
            return nil
        }
        return UIElement(axWindow)
    }

    public var focusedUIElement: UIElement? {
        guard let axElement: AXUIElement = attributeOptional(kAXFocusedUIElementAttribute) else {
            return nil
        }
        return UIElement(axElement)
    }

    public var mainWindow: UIElement? {
        guard let axWindow: AXUIElement = attributeOptional(kAXMainWindowAttribute) else {
            return nil
        }
        return UIElement(axWindow)
    }

    // MARK: - Actions

    /// Get all available actions
    public func actionNames() throws -> [String] {
        var names: CFArray?
        let error = AXUIElementCopyActionNames(axElement, &names)
        guard error == .success else {
            throw AccessibilityError.axError(error)
        }
        return names as? [String] ?? []
    }

    /// Perform an action
    public func performAction(_ action: String) throws {
        let error = AXUIElementPerformAction(axElement, action as CFString)
        guard error == .success else {
            throw AccessibilityError.axError(error)
        }
    }

    /// Press (equivalent to AXPress action)
    public func press() throws {
        try performAction(kAXPressAction)
    }

    /// Set focus
    public func focus() throws {
        try setAttribute(kAXFocusedAttribute, value: true as CFBoolean)
    }

    // MARK: - Element at Point

    /// Get the element at the specified screen position
    public func element(at point: CGPoint) throws -> UIElement {
        var element: AXUIElement?
        let error = AXUIElementCopyElementAtPosition(axElement, Float(point.x), Float(point.y), &element)
        guard error == .success, let el = element else {
            throw AccessibilityError.axError(error)
        }
        return UIElement(el)
    }

    // MARK: - Search

    /// Find all descendants matching a predicate (breadth-first search)
    public func findAll(where predicate: (UIElement) -> Bool) -> [UIElement] {
        var results: [UIElement] = []
        var queue = children
        var index = 0

        while index < queue.count {
            let current = queue[index]
            index += 1
            if predicate(current) {
                results.append(current)
            }
            queue.append(contentsOf: current.children)
        }

        return results
    }

    /// Find descendants matching a predicate with early termination (breadth-first search)
    public func findAll(where predicate: (UIElement) -> Bool, limit: Int, maxNodes: Int? = nil) -> [UIElement] {
        var results: [UIElement] = []
        var queue = children
        var index = 0
        var visited = 0
        let nodeBudget = maxNodes ?? .max

        while index < queue.count && results.count < limit && visited < nodeBudget {
            let current = queue[index]
            index += 1
            visited += 1
            if predicate(current) {
                results.append(current)
                if results.count >= limit { break }
            }
            if visited >= nodeBudget { break }
            queue.append(contentsOf: current.children)
        }

        return results
    }

    /// Find first descendant matching a predicate (breadth-first search)
    public func findFirst(where predicate: (UIElement) -> Bool) -> UIElement? {
        var queue = children
        var index = 0

        while index < queue.count {
            let current = queue[index]
            index += 1
            if predicate(current) {
                return current
            }
            queue.append(contentsOf: current.children)
        }

        return nil
    }

    /// Find elements matching any of the given roles in a single BFS pass
    public func findAll(
        roles: Set<String>,
        roleLimits: [String: Int] = [:],
        maxNodes: Int = 500
    ) -> [String: [UIElement]] {
        var results: [String: [UIElement]] = [:]
        for role in roles { results[role] = [] }

        var saturated = 0
        let totalRoles = roles.count
        var queue = children
        var index = 0
        var visited = 0

        while index < queue.count && visited < maxNodes && saturated < totalRoles {
            let current = queue[index]
            index += 1
            visited += 1

            if let role = current.role, roles.contains(role) {
                let limit = roleLimits[role] ?? .max
                if results[role]!.count < limit {
                    results[role]!.append(current)
                    if results[role]!.count >= limit {
                        saturated += 1
                    }
                }
            }

            if saturated < totalRoles && visited < maxNodes {
                queue.append(contentsOf: current.children)
            }
        }

        return results
    }

    /// Find elements by role
    public func findAll(role: String) -> [UIElement] {
        findAll { $0.role == role }
    }

    /// Find elements by role with limit
    public func findAll(role: String, limit: Int, maxNodes: Int? = nil) -> [UIElement] {
        findAll(where: { $0.role == role }, limit: limit, maxNodes: maxNodes)
    }

    /// Find element by identifier
    public func findFirst(identifier: String) -> UIElement? {
        findFirst { $0.identifier == identifier }
    }

    /// Find element by title
    public func findFirst(title: String) -> UIElement? {
        findFirst { $0.title == title }
    }

    /// Find element by title containing substring
    public func findFirst(titleContaining substring: String) -> UIElement? {
        findFirst { $0.title?.contains(substring) == true }
    }
}

// MARK: - Debug

extension UIElement: CustomDebugStringConvertible {
    public var debugDescription: String {
        var parts: [String] = []

        if let role = role {
            parts.append("role: \(role)")
        }
        if let title = title {
            parts.append("title: \"\(title)\"")
        }
        if let identifier = identifier {
            parts.append("id: \(identifier)")
        }
        if let value = stringValue {
            let truncated = value.count > 50 ? String(value.prefix(50)) + "..." : value
            parts.append("value: \"\(truncated)\"")
        }

        return "UIElement(\(parts.joined(separator: ", ")))"
    }
}
