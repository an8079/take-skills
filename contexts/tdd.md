# TDD 上下文模式

> 测试驱动开发模式的专用上下文

---

## 模式激活

当前工作模式：**TDD（测试驱动开发）**

## 核心原则

### RED → GREEN → IMPROVE 循环

```
RED      → 编写失败的测试
  ↓
GREEN    → 编写最简单的代码使测试通过
  ↓
IMPROVE  → 重构代码，保持测试通过
```

## 工作流程

### 1. RED 阶段

**目标：** 编写一个会失败的测试

**注意事项：**
- 测试应该描述预期的行为
- 测试应该清晰易读
- 一次只测试一个行为
- 测试名称应描述它测试的内容

**示例：**

```python
# 用户服务测试
def test_should_create_user_with_valid_data():
    # Given
    user_data = {
        "email": "user@example.com",
        "name": "Test User"
    }

    # When
    result = user_service.create(user_data)

    # Then
    assert result["id"] is not None
    assert result["email"] == "user@example.com"
    assert result["name"] == "Test User"
```

### 2. GREEN 阶段

**目标：** 编写最简单的代码使测试通过

**注意事项：**
- 不要考虑代码质量，先让它工作
- 只写足够的代码通过测试
- 不要写任何额外的代码

**示例：**

```python
# 最简单的实现
def create(user_data):
    return {
        "id": "1",
        **user_data
    }
```

### 3. IMPROVE 阶段

**目标：** 重构代码，保持测试通过

**注意事项：**
- 改进代码结构
- 提取重复代码
- 改进命名
- 保持所有测试通过

**示例：**

```python
# 重构后的实现
class UserService:
    def __init__(self, repository):
        self.repository = repository

    def create(self, user_data):
        self._validate_email(user_data["email"])
        return self.repository.save(user_data)
```

## 测试命名规范

### Given-When-Then 模式

```python
def test_<subject>_<scenario>_<expected_behavior>():
    # Given: 设置前置条件
    # When: 执行操作
    # Then: 验证结果
```

### 示例

| 好的测试名 | 不好的测试名 |
|-----------|-------------|
| `test_should_return_error_when_email_invalid` | `testEmail` |
| `test_should_create_user_with_valid_data` | `testUserCreate` |
| `test_should_delete_user_when_user_exists` | `testDelete` |

## 测试金字塔

```
        /\
       /  \
      / E2E \     10% - 少量端到端测试
     /--------\
    /          \
   / Integration \  20% - 适中的集成测试
  /--------------\
 /                \
/    Unit Tests    \  70% - 大量单元测试
--------------------
```

## 常用断言

### Python (pytest)

```python
# 相等性断言
assert actual == expected
assert actual is not None

# 数值断言
assert count > 0
assert len(items) == 5

# 异常断言
with pytest.raises(ValueError):
    function_that_raises()

# 容器断言
assert "item" in items
assert key in dict
```

### JavaScript (Jest)

```javascript
// 相等性断言
expect(actual).toBe(expected);
expect(actual).toEqual(expected);

// 真值断言
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();

// 异常断言
expect(() => fn()).toThrow();

// 容器断言
expect(array).toContain(item);
expect(object).toHaveProperty('key');
```

## Mock 和 Stub

### Mock 外部依赖

```python
# 使用 mock 替换真实实现
from unittest.mock import Mock

def test_should_call_repository():
    # Given
    mock_repo = Mock()
    mock_repo.save.return_value = {"id": "1", "email": "test@example.com"}
    service = UserService(mock_repo)

    # When
    result = service.create({"email": "test@example.com"})

    # Then
    mock_repo.save.assert_called_once_with({"email": "test@example.com"})
```

## 边缘情况测试

必须覆盖的边缘情况：

| 类型 | 示例 |
|------|------|
| 空值 | `[]`, `""`, `None` |
| 边界值 | `0`, `1`, `max` |
| 负数 | `-1`, `-10` |
| 极端值 | 超大数据量 |
| 无效输入 | 错误格式、类型错误 |

## 当前上下文规则

1. **测试先行** - 在编写实现代码前先写测试
2. **小步前进** - 每次只写一个测试
3. **保持测试通过** - 重构时保持所有测试通过
4. **测试独立** - 每个测试应该独立运行
5. **可读性** - 测试代码应该像文档一样易读

## 下一步

- 运行测试：`/test`
- 查看覆盖率报告
- 继续下一个测试用例
