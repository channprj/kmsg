# 关于kmsg

kmsg是面向macOS版KakaoTalk的非官方开源CLI与native MCP server。它通过公开的macOS Accessibility API操作可见桌面应用，用于读取、监控以及发送文本或图片，不实现也不绕过KakaoTalk私有LOCO protocol。

## 适用对象与维护者

项目服务于在自己控制的Mac上进行自动化的开发者、需要结构化JSON的local tool，以及在用户批准下工作的AI agent。CHANN维护者Park Hee Chan在公开GitHub仓库`channprj/kmsg`开发项目，source、issue、release、MIT License与CI记录均可核查。

## 信任与技术边界

KakaoTalk账户资料和message在用户Mac本地处理，不会上传到本静态网站。真实发送前应使用`--dry-run`核对目标和payload。Accessibility权限、desktop login状态、background-safe read、本地加密credential以及明确的MCP tool contract限定了工具行为。

## 独立性

kmsg并非Kakao Corp.关联、认可或官方产品。桌面UI变化可能影响自动化，用户需要自行确认权限、发送结果与适用policy。项目通过公开source、canonical site、可复现test与已知限制建立信任，不宣称无法验证的组织规模或服务保证。
