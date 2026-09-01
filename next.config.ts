import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // "Cadastro do time" e "Meu time" renderizavam o mesmo
        // CollaboratorsManager, com os mesmos dados e as mesmas ações — só o
        // título mudava. Duas rotas, dois itens de menu e dois botões no Resumo
        // levando à mesma tela. Consolidado em /gestao/liderados, que já é o
        // destino dos links internos e o pai das fichas individuais.
        //
        // 308 e não 404: o link pode estar salvo por alguém.
        source: "/gestao/colaboradores",
        destination: "/gestao/liderados",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
