let environments = {
  topocartDev: {
    urlApiPlataforma: "https://plataforma.desenvolvimento.geo360.topocart.dev.br",
    urlApiCadastro: "https://cadastro.desenvolvimento.geo360.topocart.dev.br",
    urlApiGateway: "https://gateway.desenvolvimento.geo360.topocart.dev.br",
  },
  etopocartDev: {
    urlApiPlataforma: "https://plataforma.dev.etopocart.com",
    urlApiCadastro: "https://cadastro.dev.etopocart.com",
    urlApiGateway: "https://gateway.dev.etopocart.dev.br",
  },
  topocart: {
    urlApiPlataforma: "https://api.geo360.topocart.dev.br",
    urlApiCadastro: "https://icad.geo360.topocart.dev.br",
    urlApiGateway: "https://gateway.geo360.topocart.dev.br",
  },
  etopocart: {
    urlApiPlataforma: "https://plataforma.apps.etopocart.com",
    urlApiCadastro: "https://cadastro.apps.etopocart.com",
    urlApiGateway: "https://gateway.apps.etopocart.dev.br",
  },
  alexania: {
    urlApiPlataforma: 'https://plataforma.geo360.alexania.go.gov.br/',
    urlApiCadastro: 'https://cadastro.geo360.alexania.go.gov.br',
    urlApiGateway: 'https://gateway.geo360.alexania.go.gov.br',
    ambiente: 'alexania',
  },
  portovelho: {
    urlApiPlataforma: 'https://plataforma.geo360.portovelho.ro.gov.br',
    urlApiCadastro: 'https://cadastro.geo360.portovelho.ro.gov.br',
    urlApiGateway: 'https://gateway.geo360.portovelho.ro.gov.br',
    ambiente: 'portovelho',
  },
};

console.log(`Ambiente -> `, import.meta.env.VITE_APP_AMBIENTE);

export var ambiente: "topocart" | "topocartDev" | "etopocart" | "etopocartDev"  | "alexania"  | "portovelho" =
  import.meta.env.VITE_APP_AMBIENTE || "topocartDev";

export let urlApiCadastro = environments[ambiente].urlApiCadastro;
export let urlApiPlataforma = environments[ambiente].urlApiPlataforma;
export let urlApiGateway = environments[ambiente].urlApiGateway;
export let production = (import.meta.env.VITE_APP_MODE === "dev" || import.meta.env.VITE_APP_MODE === "desenvolvimento" ) ? false : true;
