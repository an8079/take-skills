---
name: go-patterns
description: Go 开发模式技能。接口、goroutine、channel、context、错误处理等。
tags: [go, golang, concurrent]
---

# Go 开发模式技能

## When to Use This Skill

- 编写 Go 代码时
- 实现并发程序时
- 使用 Go 标准库时
- 处理错误时

## Quick Reference

### 核心概念

| 概念 | 说明 | 关键字 |
|------|------|--------|
| 接口 | 行为契约 | `interface` |
| 结构体 | 数据和方法 | `struct` |
| goroutine | 轻量级线程 | `go` |
| channel | 并发通信 | `chan` |
| context | 请求范围 | `context.Context` |
| 错误 | 显式错误处理 | `error` |

## 项目结构

### 标准项目布局

```
myapp/
├── cmd/
│   └── myapp/
│       └── main.go          # 入口文件
├── internal/
│   ├── config/              # 内部配置
│   ├── handler/             # HTTP 处理器
│   ├── service/             # 业务逻辑
│   ├── repository/          # 数据访问
│   └── model/               # 数据模型
├── pkg/                    # 公共库
├── api/                    # API 定义
├── scripts/                # 构建脚本
├── test/                   # 测试数据
├── go.mod                  # 模块定义
├── go.sum                  # 依赖锁定
├── Makefile                # 构建规则
└── Dockerfile              # Docker 配置
```

## 接口设计

### 基本接口

```go
// 定义接口
type UserRepository interface {
    FindByID(ctx context.Context, id int64) (*User, error)
    Create(ctx context.Context, user *User) error
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
}

// 实现接口
type userRepository struct {
    db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) FindByID(ctx context.Context, id int64) (*User, error) {
    var user User
    err := r.db.QueryRowContext(ctx,
        "SELECT id, name, email FROM users WHERE id = ?", id).
        Scan(&user.ID, &user.Name, &user.Email)
    if err != nil {
        return nil, err
    }
    return &user, nil
}

// 接口组合
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type ReadWriter interface {
    Reader
    Writer
}
```

### 接口最佳实践

```go
// ✅ 好的接口：小而专注
type Encoder interface {
    Encode(v interface{}) ([]byte, error)
}

// ✅ 好的接口：接受接口，返回结构体
func ProcessData(encoder Encoder, data Data) error {
    _, err := encoder.Encode(data)
    return err
}

// ❌ 避免：过早定义接口
// func UseInterface(u SomeInterface) { ... }

// ✅ 更好：直接使用具体类型
func UseConcrete(u *User) { ... }

// 需要时再引入接口
```

## 并发编程

### Goroutine

```go
// 基本使用
func main() {
    go say("hello")
    go say("world")

    time.Sleep(time.Second)
}

func say(s string) {
    for i := 0; i < 5; i++ {
        time.Sleep(100 * time.Millisecond)
        fmt.Println(s)
    }
}

// 使用 WaitGroup 等待所有 goroutine 完成
func main() {
    var wg sync.WaitGroup

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            fmt.Printf("Worker %d\n", n)
            time.Sleep(100 * time.Millisecond)
        }(i)
    }

    wg.Wait()
}
```

### Channel

```go
// 基本使用
func main() {
    ch := make(chan int)

    go func() {
        ch <- 1
    }()

    value := <-ch
    fmt.Println(value)
}

// 带缓冲的 channel
func main() {
    ch := make(chan int, 2)

    ch <- 1
    ch <- 2
    // ch <- 3  // 阻塞，因为缓冲区已满

    fmt.Println(<-ch)
    fmt.Println(<-ch)
}

// 关闭 channel
func worker(done chan<- bool) {
    time.Sleep(1 * time.Second)
    close(done)
}

func main() {
    done := make(chan bool)
    go worker(done)

    <-done
    fmt.Println("Worker finished")
}

// range channel
func main() {
    ch := make(chan int)

    go func() {
        for i := 0; i < 5; i++ {
            ch <- i
        }
        close(ch)
    }()

    for v := range ch {
        fmt.Println(v)
    }
}
```

### Select

```go
func main() {
    ch1 := make(chan string, 1)
    ch2 := make(chan string, 1)

    go func() {
        time.Sleep(100 * time.Millisecond)
        ch1 <- "one"
    }()

    go func() {
        time.Sleep(200 * time.Millisecond)
        ch2 <- "two"
    }()

    for i := 0; i < 2; i++ {
        select {
        case msg1 := <-ch1:
            fmt.Println("Received:", msg1)
        case msg2 := <-ch2:
            fmt.Println("Received:", msg2)
        case <-time.After(500 * time.Millisecond):
            fmt.Println("Timeout!")
        }
    }
}

// 带默认的 select
func main() {
    ticker := time.NewTicker(100 * time.Millisecond)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            fmt.Println("Tick")
        default:
            fmt.Println("Doing other work")
            time.Sleep(50 * time.Millisecond)
        }
    }
}
```

### Worker Pool

```go
type Job struct {
    ID int
    Payload string
}

type Result struct {
    JobID int
    Output string
}

func worker(id int, jobs <-chan Job, results chan<- Result) {
    for job := range jobs {
        // 处理任务
        time.Sleep(100 * time.Millisecond)
        results <- Result{
            JobID:  job.ID,
            Output: fmt.Sprintf("Worker %d processed job %d", id, job.ID),
        }
    }
}

func main() {
    jobs := make(chan Job, 100)
    results := make(chan Result, 100)

    // 启动 worker
    for w := 1; w <= 5; w++ {
        go worker(w, jobs, results)
    }

    // 发送任务
    for j := 1; j <= 20; j++ {
        jobs <- Job{ID: j, Payload: fmt.Sprintf("payload %d", j)}
    }
    close(jobs)

    // 收集结果
    for r := 1; r <= 20; r++ {
        result := <-results
        fmt.Println(result.Output)
    }
}
```

## Context

### 基本使用

```go
func main() {
    ctx := context.Background()

    // 设置超时
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    // 设置值
    ctx = context.WithValue(ctx, "userID", 123)

    result, err := doSomething(ctx)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println("Result:", result)
}

func doSomething(ctx context.Context) (string, error) {
    select {
    case <-time.After(3 * time.Second):
        return "done", nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}
```

### Context 传播

```go
func handler(w http.ResponseWriter, r *http.Request) {
    // 从请求获取 context
    ctx := r.Context()

    // 添加超时
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    // 调用服务
    result, err := service.DoSomething(ctx)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    fmt.Fprintln(w, result)
}

func (s *Service) DoSomething(ctx context.Context) (string, error) {
    // 可以从 context 获取值
    userID := ctx.Value("userID")
    fmt.Printf("User ID: %v\n", userID)

    // 传递给数据库操作
    return s.repo.FindUser(ctx, userID)
}
```

## 错误处理

### 基本错误处理

```go
// 定义错误类型
type AppError struct {
    Code    string
    Message string
    Cause   error
}

func (e *AppError) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("%s: %s (caused by: %v)", e.Code, e.Message, e.Cause)
    }
    return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
    return e.Cause
}

// 创建错误
func NewAppError(code, message string, cause error) *AppError {
    return &AppError{
        Code:    code,
        Message: message,
        Cause:   cause,
    }
}

// 使用 errors.Is 和 errors.As
func main() {
    err := NewAppError("E001", "something failed", errors.New("cause"))

    if errors.Is(err, errors.New("cause")) {
        fmt.Println("Error is caused by 'cause'")
    }

    var appErr *AppError
    if errors.As(err, &appErr) {
        fmt.Printf("App error code: %s\n", appErr.Code)
    }
}
```

### 错误包装

```go
// Go 1.13+ 使用 fmt.Errorf 和 %w
func readFile(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        // %w 包装错误，可以解包
        return nil, fmt.Errorf("failed to read file %s: %w", path, err)
    }
    return data, nil
}

// 不需要解包的错误使用 %v
func readFile(path string) ([]byte, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        // %v 不包装错误
        return nil, fmt.Errorf("failed to read file %s: %v", path, err)
    }
    return data, nil
}
```

### 错误检查

```go
// 标准错误检查模式
func doSomething() error {
    resource, err := acquireResource()
    if err != nil {
        return fmt.Errorf("acquire resource: %w", err)
    }
    defer releaseResource(resource)

    // 处理资源
    return processResource(resource)
}

// 简化的错误检查（Go 1.20+）
func doSomething() error {
    resource := acquireResource()
    if err := resource.Err(); err != nil {
        return err
    }
    defer releaseResource(resource)

    return processResource(resource)
}
```

## 结构体和方法

### 定义结构体

```go
type User struct {
    ID       int64     `json:"id"`
    Name     string    `json:"name"`
    Email    string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
}

// 构造函数
func NewUser(name, email string) *User {
    return &User{
        Name:     name,
        Email:    email,
        CreatedAt: time.Now(),
    }
}

// 方法（值接收者）
func (u User) String() string {
    return fmt.Sprintf("%s <%s>", u.Name, u.Email)
}

// 方法（指针接收者）
func (u *User) SetEmail(email string) {
    u.Email = email
}

// 实现接口
func (u User) MarshalJSON() ([]byte, error) {
    return json.Marshal(struct {
        ID    string `json:"id"`
        Name  string `json:"name"`
        Email string `json:"email"`
    }{
        ID:    strconv.FormatInt(u.ID, 36),
        Name:  u.Name,
        Email: u.Email,
    })
}
```

## 测试

### 表格驱动测试

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 2, 3, 5},
        {"negative", -2, -3, -5},
        {"mixed", -2, 3, 1},
        {"zero", 0, 0, 0},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", tt.a, tt.b, result, tt.expected)
            }
        })
    }
}

func Add(a, b int) int {
    return a + b
}
```

### Mock 测试

```go
// 接口
type UserRepository interface {
    FindByID(ctx context.Context, id int64) (*User, error)
}

// Mock 实现
type MockUserRepository struct {
    FindByIDFunc func(ctx context.Context, id int64) (*User, error)
}

func (m *MockUserRepository) FindByID(ctx context.Context, id int64) (*User, error) {
    return m.FindByIDFunc(ctx, id)
}

// 测试
func TestUserService_GetUser(t *testing.T) {
    mockRepo := &MockUserRepository{
        FindByIDFunc: func(ctx context.Context, id int64) (*User, error) {
            return &User{ID: id, Name: "Test User"}, nil
        },
    }

    service := NewUserService(mockRepo)
    user, err := service.GetUser(context.Background(), 1)

    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }

    if user.Name != "Test User" {
        t.Errorf("expected name 'Test User', got '%s'", user.Name)
    }
}
```

## 常用标准库

### HTTP Server

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
)

type User struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

func main() {
    http.HandleFunc("/users", usersHandler)
    http.HandleFunc("/health", healthHandler)

    fmt.Println("Server listening on :8080")
    http.ListenAndServe(":8080", nil)
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        users := []User{
            {Name: "Alice", Email: "alice@example.com"},
            {Name: "Bob", Email: "bob@example.com"},
        }
        json.NewEncoder(w).Encode(users)
    case http.MethodPost:
        var user User
        if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        // 处理用户创建
        w.WriteHeader(http.StatusCreated)
        json.NewEncoder(w).Encode(user)
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    fmt.Fprintf(w, "OK")
}
```

### 常用推荐库

| 库 | 用途 |
|------|------|
| `gin-gonic/gin` | HTTP 框架 |
| `gorm.io/gorm` | ORM |
| `go-redis/redis` | Redis 客户端 |
| `stretchr/testify` | 测试工具 |
| `go.uber.org/zap` | 高性能日志 |
| `go.uber.org/czmq` | 零分配日志 |
| `golang.org/x/oauth2` | OAuth2 |
| `google.golang.org/grpc` | gRPC |
| `github.com/jmoiron/sqlx` | SQL 扩展 |
| `github.com/spf13/viper` | 配置管理 |

## 最佳实践

1. **错误处理** - 不要忽略错误，使用 `_, err :=` 时要有理由
2. **接口设计** - 接收者定义接口，发送者实现接口
3. **并发安全** - 使用 channel 通信，共享数据用 mutex 保护
4. **Context 使用** - 将 context 作为第一个参数传递
5. **命名规范** - 遵循 Go 命名约定（驼峰、首字母大写导出）
6. **避免全局变量** - 使用依赖注入
7. **使用 go vet** - 静态分析工具
8. **格式化代码** - 使用 `go fmt`

## 参考资源

- [Effective Go](https://golang.org/doc/effective_go.html)
- [Go by Example](https://gobyexample.com/)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [Standard Library](https://pkg.go.dev/std)
