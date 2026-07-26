# kmsg版本管理

`kmsg`使用包含日期的版本格式。

```text
MAJOR.YYMMDD.PATCH_COUNT
```

示例:

```text
1.260727.0
```

## 唯一来源

仓库根目录的`VERSION`是唯一版本来源，文件内容不包含开头的`v`。

构建时，SwiftPM插件会验证格式并生成`BuildVersion`。`kmsg --version`、`kmsg status`与发布产物均使用同一数值。

## 字段含义

- `MAJOR`: 在破坏性变更或重大里程碑时递增
- `YYMMDD`: 发布日期
- `PATCH_COUNT`: 当天首个版本为`0`，追加发布时依次递增

Git标签使用`v`前缀。

```text
v1.260727.0
```

## 操作规则

- 创建发布标签前更新`VERSION`
- 新日期的首次发布使用`PATCH_COUNT=0`
- 同日追加发布只增加patch count
- 日期变化时把patch count重置为`0`
- 二进制报告的版本与标签不一致时，发布流程必须失败

## 提升版本

不要手工编辑`VERSION`，请使用项目提供的命令。

```bash
make release-patch
make release-major
```

修改前可先执行dry run。

```bash
scripts/headatever.sh patch --dry-run
```

自动化会依次完成下一版本验证、`VERSION`更新、`chore(release): v<version>`提交以及带注释的标签创建。

完整流程请参阅[英文版本管理文档](https://github.com/channprj/kmsg/blob/main/VERSIONING.md)。
