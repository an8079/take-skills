---
name: rust-patterns
description: Rust 开发模式技能。所有权系统、借用检查、错误处理、并发等。
tags: [rust, systems, memory]
---

# Rust 开发模式技能

## When to Use This Skill

- 编写 Rust 代码时
- 处理所有权和借用问题时
- 实现错误处理时
- 编写并发代码时

## Quick Reference

### 核心概念

| 概念 | 说明 | 关键字 |
|------|------|--------|
| 所有权 | 每个值有一个所有者 | `move` |
| 借用 | 引用值而不获取所有权 | `&T`, `&mut T` |
| 生命周期 | 引用有效的作用域 | `'a` |
| 错误处理 | 显式的错误处理 | `Result<T, E>`, `Option<T>` |
| 并发 | 无数据竞争的并发 | `Arc`, `Mutex`, `Channel` |

## 所有权和借用

### 基本规则

```rust
// ✅ 正确：不可变借用
fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s);  // 借用 s
    println!("The length of '{}' is {}.", s, len);  // s 仍然有效
}

fn calculate_length(s: &String) -> usize {
    s.len()
}

// ✅ 正确：可变借用（独占）
fn main() {
    let mut s = String::from("hello");
    change(&mut s);  // 可变借用 s
}

fn change(some_string: &mut String) {
    some_string.push_str(", world");
}

// ❌ 错误：同时存在可变和不可变借用
// fn main() {
//     let mut s = String::from("hello");
//     let r1 = &s;  // 不可变借用
//     let r2 = &mut s;  // 错误！不能同时存在可变和不可变借用
// }
```

### 结构体中的借用

```rust
// ❌ 编译错误：生命周期未标注
// struct Context<'a> {
//     value: &'a i32,
// }

// ✅ 正确：显式生命周期
struct Context<'a> {
    value: &'a i32,
}

impl<'a> Context<'a> {
    fn new(value: &'a i32) -> Self {
        Context { value }
    }

    fn get_value(&self) -> i32 {
        *self.value
    }
}
```

### 迭代器借用

```rust
fn main() {
    let mut vec = vec![1, 2, 3, 4, 5];

    // ✅ 正确：先迭代再修改
    let sum: i32 = vec.iter().sum();
    vec.push(6);

    // ✅ 正确：使用迭代器修改
    vec.iter_mut().for_each(|x| *x += 1);

    // ✅ 正确：drain 迭代器（移动所有权）
    let drained: Vec<i32> = vec.drain(..3).collect();
}
```

## 错误处理

### Result 类型

```rust
// 定义错误类型
#[derive(Debug)]
enum AppError {
    Io(std::io::Error),
    Parse(String),
    Validation(String),
}

// 从其他错误转换
impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err)
    }
}

// 使用 Result
fn read_file(path: &str) -> Result<String, AppError> {
    let content = std::fs::read_to_string(path)?;  // ? 运算符
    Ok(content)
}

// 处理错误
fn main() {
    match read_file("config.txt") {
        Ok(content) => println!("{}", content),
        Err(AppError::Io(e)) => eprintln!("IO error: {}", e),
        Err(e) => eprintln!("Error: {:?}", e),
    }
}
```

### Option 类型

```rust
fn find_user(id: u32) -> Option<User> {
    // 查找用户，可能返回 None
    if id == 0 {
        None
    } else {
        Some(User::new(id))
    }
}

// 使用 Option
fn main() {
    let user = find_user(1);

    // 方法 1: match
    match user {
        Some(u) => println!("Found user: {}", u.name),
        None => println!("User not found"),
    }

    // 方法 2: if let
    if let Some(u) = user {
        println!("Found user: {}", u.name);
    }

    // 方法 3: map/and_then 链式操作
    let email = user.map(|u| u.email).unwrap_or_default();

    // 方法 4: ? 运算符（在函数中）
    // let email = user?.email;  // 类似 JavaScript
}
```

### 自定义错误

```rust
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub struct AppError {
    pub kind: ErrorKind,
    pub message: String,
    pub source: Option<Box<dyn Error + Send + Sync>>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ErrorKind {
    NotFound,
    InvalidInput,
    PermissionDenied,
    InternalError,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}: {}", self.kind, self.message)
    }
}

impl Error for AppError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        self.source.as_ref().map(|e| e.as_ref())
    }
}

impl fmt::Display for ErrorKind {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ErrorKind::NotFound => write!(f, "Not Found"),
            ErrorKind::InvalidInput => write!(f, "Invalid Input"),
            ErrorKind::PermissionDenied => write!(f, "Permission Denied"),
            ErrorKind::InternalError => write!(f, "Internal Error"),
        }
    }
}

// 使用 thiserror 简化错误定义
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("User not found")]
    UserNotFound,

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Parse error: {0}")]
    Parse(#[from] std::num::ParseIntError),
}
```

## 并发

### Arc + Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;

struct Counter {
    value: Mutex<i32>,
}

impl Counter {
    fn new() -> Self {
        Counter {
            value: Mutex::new(0),
        }
    }

    fn increment(&self) {
        let mut num = self.value.lock().unwrap();
        *num += 1;
    }

    fn get(&self) -> i32 {
        let num = self.value.lock().unwrap();
        *num
    }
}

fn main() {
    let counter = Arc::new(Counter::new());
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            for _ in 0..100 {
                counter.increment();
            }
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Counter: {}", counter.get());
}
```

### Channel (消息传递)

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // 创建通道
    let (tx, rx) = mpsc::channel();

    // 发送线程
    thread::spawn(move || {
        for i in 0..10 {
            tx.send(i).unwrap();
            thread::sleep(std::time::Duration::from_millis(100));
        }
    });

    // 接收线程
    for received in rx {
        println!("Received: {}", received);
    }
}

// 多发送者
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    let tx1 = tx.clone();
    let tx2 = tx.clone();

    thread::spawn(move || {
        tx1.send("From thread 1").unwrap();
    });

    thread::spawn(move || {
        tx2.send("From thread 2").unwrap();
    });

    drop(tx);  // 关闭原始发送者

    for received in rx {
        println!("Received: {}", received);
    }
}
```

### 原子类型

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(AtomicUsize::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            for _ in 0..1000 {
                counter.fetch_add(1, Ordering::Relaxed);
            }
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Counter: {}", counter.load(Ordering::Relaxed));
}
```

## 通用编程

### 泛型

```rust
// 泛型函数
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

// 泛型结构体
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn new(x: T, y: T) -> Self {
        Point { x, y }
    }
}

// 为特定类型实现方法
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

### Trait

```rust
// 定义 Trait
trait Animal {
    fn make_sound(&self) -> &'static str;
    fn name(&self) -> &'static str;
}

// 实现 Trait
struct Dog {
    name: String,
}

impl Animal for Dog {
    fn make_sound(&self) -> &'static str {
        "Woof!"
    }

    fn name(&self) -> &str {
        &self.name
    }
}

struct Cat {
    name: String,
}

impl Animal for Cat {
    fn make_sound(&self) -> &'static str {
        "Meow!"
    }

    fn name(&self) -> &str {
        &self.name
    }
}

// Trait Bound
fn greet<T: Animal>(animal: &T) {
    println!("{} says {}", animal.name(), animal.make_sound());
}

// 使用 impl Trait 语法
fn greet2(animal: &impl Animal) {
    println!("{} says {}", animal.name(), animal.make_sound());
}
```

### 迭代器

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // 链式调用
    let sum: i32 = numbers.iter()
        .filter(|&&x| x > 2)
        .map(|&x| x * x)
        .sum();

    println!("Sum of squares: {}", sum);

    // 消费器
    let doubled: Vec<i32> = numbers.iter()
        .map(|x| x * 2)
        .collect();

    // 自定义迭代器
    struct Counter {
        current: usize,
        max: usize,
    }

    impl Counter {
        fn new(max: usize) -> Counter {
            Counter { current: 0, max }
        }
    }

    impl Iterator for Counter {
        type Item = usize;

        fn next(&mut self) -> Option<Self::Item> {
            if self.current < self.max {
                let current = self.current;
                self.current += 1;
                Some(current)
            } else {
                None
            }
        }
    }
}
```

## 智能指针

### Box

```rust
// 在堆上分配数据
fn main() {
    let b = Box::new(5);
    println!("b = {}", b);

    // 递归类型
    #[derive(Debug)]
    enum List {
        Cons(i32, Box<List>),
        Nil,
    }

    use List::{Cons, Nil};

    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil)))));
    println!("{:?}", list);
}
```

### Rc (引用计数)

```rust
use std::rc::Rc;

enum List {
    Cons(i32, Rc<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));

    // 创建多个引用
    let b = Cons(3, Rc::clone(&a));
    let c = Cons(4, Rc::clone(&a));

    println!("Reference count of a: {}", Rc::strong_count(&a));
}
```

### RefCell (内部可变性)

```rust
use std::cell::RefCell;

struct Messenger {
    messages: RefCell<Vec<String>>,
}

impl Messenger {
    fn new() -> Self {
        Messenger {
            messages: RefCell::new(Vec::new()),
        }
    }

    fn send(&self, message: String) {
        self.messages.borrow_mut().push(message);
    }

    fn get_messages(&self) -> Vec<String> {
        self.messages.borrow().clone()
    }
}
```

## 测试

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    #[should_panic(expected = "Index out of bounds")]
    fn test_panic() {
        let v = vec![1, 2, 3];
        v[99];
    }

    #[test]
    fn test_result() -> Result<(), String> {
        if 2 + 2 == 4 {
            Ok(())
        } else {
            Err(String::from("two plus two does not equal four"))
        }
    }
}
```

## 常用 Crate 推荐

| Crate | 用途 |
|--------|------|
| `serde` | 序列化/反序列化 |
| `tokio` | 异步运行时 |
| `anyhow` | 错误处理 |
| `thiserror` | 错误类型定义 |
| `clap` | 命令行解析 |
| `tracing` | 结构化日志 |
| `reqwest` | HTTP 客户端 |
| `sqlx` | 数据库访问 |
| `axum` | Web 框架 |
| `sqlx` | 类型安全的 SQL |

## 最佳实践

1. **优先借用** - 尽量使用引用而非移动所有权
2. **显式错误处理** - 使用 `Result` 和 `Option` 处理错误
3. **使用迭代器** - 利用零成本抽象的迭代器
4. **避免 Clone** - Clone 会产生额外开销
5. **使用 Cargo 工具** - `cargo check`, `cargo clippy`, `cargo fmt`
6. **编写测试** - Rust 内置测试支持
7. **遵循命名规范** - 使用 snake_case, PascalCase 等
8. **使用文档注释** - `///` 用于公共 API 文档

## 参考资源

- [The Rust Programming Language](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [API 文档](https://doc.rust-lang.org/std/)
- [Rustlings](https://github.com/rust-lang/rustlings)
