import { buildServer } from "./server";

const port = Number(process.env.PORT ?? 3000);

buildServer()
  .listen({ port, host: "0.0.0.0" })
  .then((address) => {
    process.stderr.write(`포켓덱스 어드바이저 서버 시작: ${address}\n`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
