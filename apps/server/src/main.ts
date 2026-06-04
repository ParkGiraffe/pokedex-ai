import { createApp } from "./app.factory";

const bootstrap = async (): Promise<void> => {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3007);
  await app.listen(port, "0.0.0.0");
  process.stderr.write(`포켓덱스 어드바이저 서버 시작: 포트 ${port}\n`);
};

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
