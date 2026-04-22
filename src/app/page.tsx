import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.kicker}>DPD Extension Backend</p>
        <h1 className={styles.title}>扩展前端保留，Web 端精简为 API 服务</h1>
        <p className={styles.description}>
          当前仓库只保留 Chrome 扩展所需的最小后端能力，`npm run dev` 启动后主要提供激活码校验和 AI 地址解析接口。
        </p>
        <div className={styles.cardGrid}>
          <article className={styles.card}>
            <h2>扩展目录</h2>
            <p>`/src/extension`</p>
          </article>
          <article className={styles.card}>
            <h2>解析接口</h2>
            <p>`POST /api/parse-address`</p>
          </article>
          <article className={styles.card}>
            <h2>激活接口</h2>
            <p>`POST /api/auth/verify`</p>
          </article>
        </div>
      </section>
    </main>
  );
}
