---
name: frontend-patterns
description: 前端开发模式技能。React/Vue/Angular 等前端框架的最佳实践。
tags: [frontend, react, vue, ui]
---

# 前端开发模式技能

## When to Use This Skill

- 开发前端项目时
- 使用 React、Vue、Angular 等框架时
- 需要前端最佳实践指导时

## Quick Reference

### 组件设计原则

| 原则 | 说明 |
|------|------|
| 单一职责 | 每个组件只做一件事 |
| 可复用 | 组件应该可以在多处复用 |
| 可组合 | 小组件组合成大组件 |
| 纯组件优先 | 纯组件更容易测试 |

### React 模式

#### 组件结构

```tsx
// ✅ 好的组件结构
interface UserProfileProps {
  user: User;
  onEdit: (user: User) => void;
}

export function UserProfile({ user, onEdit }: UserProfileProps) {
  const handleEdit = () => {
    onEdit(user);
  };

  return (
    <div className="user-profile">
      <Avatar src={user.avatar} />
      <div className="user-info">
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
      <Button onClick={handleEdit}>编辑</Button>
    </div>
  );
}
```

#### Hooks 模式

```tsx
// 自定义 Hook 提取逻辑
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser(id)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  return { user, loading, error };
}

// 使用
function UserComponent({ userId }: { userId: string }) {
  const { user, loading, error } = useUser(userId);

  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;
  return <UserProfile user={user!} />;
}
```

#### 状态管理

```tsx
// Context + 自定义 Hook
interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const user = await api.login(email, password);
    setUser(user);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
```

#### 性能优化

```tsx
// 使用 useMemo 缓存计算结果
const filteredItems = useMemo(
  () => items.filter(item => item.active),
  [items]
);

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  onAction(item);
}, [item, onAction]);

// 使用 React.memo 防止不必要重渲染
const ExpensiveComponent = React.memo(({ data }) => {
  // 组件实现
});

// 代码分割
const LazyComponent = React.lazy(() => import('./LazyComponent'));
```

### Vue 模式

```vue
<!-- ✅ 好的组件结构 -->
<template>
  <div class="user-profile">
    <Avatar :src="user.avatar" />
    <div class="user-info">
      <h2>{{ user.name }}</h2>
      <p>{{ user.email }}</p>
    </div>
    <Button @click="handleEdit">编辑</Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  user: User;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [user: User];
}>();

const handleEdit = () => {
  emit('edit', props.user);
};
</script>

<style scoped>
.user-profile {
  /* 样式 */
}
</style>
```

### 样式最佳实践

```tsx
// 使用 CSS Modules
import styles from './UserProfile.module.css';

function UserProfile() {
  return <div className={styles.container}>...</div>;
}

// 使用 Tailwind CSS
function UserProfile() {
  return (
    <div className="flex items-center gap-4">
      {/* */}
    </div>
  );
}

// 响应式设计
function UserProfile() {
  return (
    <div className="
      flex flex-col md:flex-row
      p-4 md:p-8
    ">
      {/* */}
    </div>
  );
}
```

## Examples

### Example 1: 表单组件

```tsx
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function FormField({ label, value, onChange, error }: FormFieldProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">{label}</label>
      <input
        className={`form-field__input ${error ? 'form-field__input--error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}
```

### Example 2: 列表组件

```tsx
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
}

export function VirtualList<T>({ items, itemHeight, renderItem }: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = start + Math.ceil(window.innerHeight / itemHeight) + 1;
    return items.slice(start, end).map((item, i) => ({
      item,
      index: start + i,
      offsetY: (start + i) * itemHeight,
    }));
  }, [items, itemHeight, scrollTop]);

  return (
    <div
      ref={containerRef}
      className="virtual-list"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{ height: items.length * itemHeight }}
    >
      {visibleItems.map(({ item, index, offsetY }) => (
        <div key={index} style={{ transform: `translateY(${offsetY}px)` }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
```

## References

- [take-skills/skills/frontend-design/SKILL.md](../take-skills/skills/frontend-design/SKILL.md)
- [everything-claude-code/skills/frontend-patterns/SKILL.md](../everything-claude-code/skills/frontend-patterns/SKILL.md)

## Maintenance

- 来源：结合两个项目的前端开发经验
- 最后更新：2026-01-24
