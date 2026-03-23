[English](README.en.md) | 中文

# claude-studio

**Claude Code のための知的マルチエージェント・オーケストレーション。**

 specialized agents、tools、skills を調整し、エンドツーエンドのソフトウェア開発を実現するマルチエージェント・オーケストレーション・フレームワーク。

---

## クイックスタート

**ステップ 1: 依存関係のインストール**

```bash
# Claude Code がインストールされているか確認
claude --version
```

**ステップ 2: 構造を探索**

```bash
# コアディレクトリ
agents/    # 5つの specialized agents
commands/  # 8つの開発コマンド
skills/    # ドメインスキルライブラリ
docs/      # 技術仕様書
rules/     # アーキテクチャ＆セキュリティルール
scripts/   # エンジニアリングスクリプト
```

**ステップ 3: 開発を開始**

```
/interview  # 要件インタビュー
/plan       # タスク計画
/code       # 実装
/test       # テスト
/review     # コードレビュー
```

---

## アーキテクチャ

### Agents（5コア）

| Agent | 役割 |
|-------|------|
| `interviewer` | 要件発見 |
| `architect` | システム設計 |
| `coder` | 実装 |
| `reviewer` | コードレビュー |
| `debug-helper` | デバッグアシスタント |

### Commands（8コア）

| コマンド | 目的 |
|---------|------|
| `/interview` | 要件インタビュー |
| `/spec` | 仕様設計 |
| `/plan` | タスク計画 |
| `/code` | 実装 |
| `/tdd` | TDDモード |
| `/test` | テスト |
| `/review` | コードレビュー |
| `/debug` | デバッグモード |

---

## 開発ワークフロー

```
要件インタビュー → 仕様 → 計画 → 実装 → テスト → レビュー → 納品
```

### フェーズフロー

| フェーズ | コマンド | 説明 |
|---------|---------|------|
| Interview | `/interview` | ソクラテス式質問で要件を発見 |
| Spec | `/spec` | 技術仕様を作成 |
| Plan | `/plan` | 実行可能なタスクに分解 |
| Code | `/code` | 機能を実装 |
| Test | `/test` | 機能を検証 |
| Review | `/review` | 品質保証 |
| Debug | `/debug` | 問題を修正 |

---

## スキルライブラリ

ドメイン固有のスキルが agent の能力を広げます：

| スキル | 説明 |
|-------|------|
| `git-workflow/` | Git操作とワークフロー |
| `code-review/` | コード品質分析 |
| `claude-skills/` | スキル作成のメタスキル |
| `mcp-builder/` | MCPサーバ開発 |
| `webapp-testing/` | Webアプリケーションテスト |
| `pdf-skills/` | PDF操作 |
| `docx/` | Word文書処理 |
| `graphql/` | GraphQL開発 |
| `kubernetes/` | K8sデプロイメント |
| `rust-patterns/` | Rustイディオム |
| `go-patterns/` | Goイディオム |
| `java-spring/` | Springフレームワーク |
| `nextjs/` | Next.js開発 |

---

## スクリプト

| スクリプト | 目的 |
|---------|------|
| `phase-manager.js` | フェーズ管理 |
| `scope-manager.js` | スコープ管理 |
| `memory-manager.js` | メモリ管理 |
| `architecture-validator.js` | アーキテクチャ検証 |
| `code-entropy.js` | コードエントロピー治理 |
| `project-analyzer.js` | プロジェクト分析 |

---

## トリガーキーワード

| 入力 | 動作 |
|------|------|
| `开始访谈` | idelインタビュー了么 Enter interview mode |
| `导入项目` | 既存プロジェクトをインポート |
| `分析项目` | プロジェクトアーキテクチャを分析 |
| `设置范围` | 開発スコープを管理 |

---

## ドキュメント

- `docs/` - 技術仕様ドキュメント
- `docs/spec-template.md` - 仕様テンプレート
- `docs/deploy/` - デプロイメント設定テンプレート

## ライセンス

MIT
