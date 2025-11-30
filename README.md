# Project JARVIS 概要定義書

## 1. ビジョンと基本コンセプト

**「人間はコンテキスト（文脈）の支配に徹し、実行はAIが担う」**

従来の「人間が作業し、AIが補助する」関係を逆転させます。ユーザーはプロジェクトの目標、背景、制約条件（コンテキスト）の管理に集中し、実際のPC操作や実作業は自律型AIエージェント「JARVIS」が実行します。

## 2. ターゲット領域

システムは主に以下の2つの業務領域をカバーします。

- **エンジニアリング:** コーディング、環境構築、テスト、Git管理、デプロイ。
- **動画制作・クリエイティブ:** 素材収集、動画編集ソフト（DaVinci Resolve等）の操作、レンダリング。

```mermaid
graph TD
    subgraph Interchangeable_Clients ["【入れ替え可能なクライアント】(その時の使用コスト状況などで選択)"]
        ClientA["Claude Desktop App"]
        ClientB["Custom Gemini CLI<br/>(Python script via API)"]
        ClientC["Local LLM Client<br/>(via Mac Studio)"]
    end

    subgraph The_Protocol ["Model Context Protocol (MCP)"]
        direction TB
        Pipe[Standard Input/Output JSON-RPC]
    end

    subgraph JARVIS_Entity ["【JARVIS 本体】(永続化層)"]
        direction TB
        
        subgraph Memory_Server ["MCP Server: Memory & Context"]
            Logic[記憶の代謝ロジック]
            VectorDB[("Vector DB<br/>Chroma/SQLite")]
            Note["ここがJARVISの<br/>魂・知識・ログ"]
        end

        subgraph Desktop_Server ["MCP Server: Desktop Control"]
            Vision[Vision Analysis]
            Input[Mouse/Key Input]
        end
        
        subgraph Engineering_Server ["MCP Server: Engineering"]
            FileSys[FileSystem]
            Shell[Terminal]
        end
    end

    ClientA --> Pipe
    ClientB --> Pipe
    ClientC --> Pipe

    Pipe --> Memory_Server
    Pipe --> Desktop_Server
    Pipe --> Engineering_Server
```