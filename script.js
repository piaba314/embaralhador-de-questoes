const entrada = document.getElementById("entrada");
const btnEmbaralhar = document.getElementById("btn-embaralhar");
const numeroDeVersoes = document.getElementById("numero-de-versoes");
const saidaVersoes = document.getElementById("versoes");

btnEmbaralhar.onclick = () => {
  let questoes = leQuestoes(entrada);
  let versoes = geraVersoes(questoes, numeroDeVersoes.value);
  renderizaVersoes(versoes, saidaVersoes);
}
