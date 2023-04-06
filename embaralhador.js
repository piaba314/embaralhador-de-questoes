const separadorQuestoes = /^\s*\d+\./m;
const separadorAlternativas = /^\s*[a-zA-Z]+\)/m;

function stringParaQuestoes(str){
  return str.split(separadorQuestoes).slice(1).map((questaoTexto, id) => {
    let pedacos = questaoTexto.split(separadorAlternativas).map(p => p.trim());
    let alternativas = pedacos.slice(1);
    let resposta = "";
    alternativas.forEach((alt, i) => {
      if (alt[alt.length-1] === "*"){
        alternativas[i] = alt.slice(0, alt.length-1).trim();
        resposta = alternativas[i];
      }
    })
    return {id, enunciado: pedacos[0], alternativas, resposta};
  })
}

function geraGabarito(questoes){
  return questoes.map(questao => {
    let idx = questao.alternativas.indexOf(questao.resposta);
    if (idx === -1) return " ";
    return String.fromCharCode(idx + 65);
  })
}

function questoesParaString(questoes){
  return questoes.map((q, i) => {
    return `${i + 1}. ${q.enunciado}\n${alternativasParaString(q.alternativas)}`
  }).join("\n\n");
}

function alternativasParaString(alternativas){
  return alternativas.map((alt, i) => `${String.fromCharCode(i + 97)}) ${alt}`).join("\n");
}

function embaralhaArray(arr){
  let arrCopia = JSON.parse(JSON.stringify(arr));
  for(let i = 0; i < arrCopia.length - 1; i++){
    let j = Math.floor(Math.random() * arrCopia.length);
    let aux = arrCopia[i];
    arrCopia[i] = arrCopia[j];
    arrCopia[j] = aux;
  }
  return arrCopia;
}

function embaralhaQuestoes(questoes){
  return embaralhaArray(questoes);
}

function embaralhaAlternativas(questoes){
  return questoes.map(q => {
    return {
      id: q.id,
      enunciado: q.enunciado,
      alternativas: embaralhaArray(q.alternativas),
      resposta: q.resposta,
    }
  });
}

function embaralhaQuestoesEAlternativas(questoes){
  return embaralhaAlternativas(embaralhaQuestoes(questoes));
}

function geraVersoes(questoes, n){
  let versoes = [];
  while (versoes.length < n){
    let versao = embaralhaQuestoesEAlternativas(questoes);
    if (!versoes.some(v => questaoMesmaPosicao(v, versao))){
      versoes.push(versao);
    }
  }
  return versoes;
}

function questaoMesmaPosicao(arr1, arr2){
  for(let i = 0; i < arr1.length; i++){
    if (arr1[i].id == arr2[i].id){
      return true;
    }
  }
  return false;
}

function removeTagsExcetoImagens(str){
  return str.replaceAll("</p>", "\n")
            .replaceAll("</div>", "\n")
            .replaceAll(/<(?!img|\/img).*?>/g, "")
            .replaceAll("&nbsp;", "")
}

function leQuestoes(container){
  return stringParaQuestoes(removeTagsExcetoImagens(container.innerHTML));
}

function renderizaQuestoes(questoes, alvo){
  alvo.innerHTML = "";
  questoes.forEach((questao, i) => {
    let questaoContainer = criaContainer("div", "questao", alvo);
    
    let enunciadoContainer = criaContainer("div", "enunciado", questaoContainer);
    enunciadoContainer.innerHTML = `<span class="numero">${i+1}. </span> ${questao.enunciado}`

    let alternativasContainer = criaContainer("div", "alternativas", questaoContainer);
    questao.alternativas.forEach((alternativa, i) => {
      let alternativaContainer = criaContainer("div", "alternativa", alternativasContainer);
      alternativaContainer.innerHTML = `${String.fromCharCode(i+97)}) ${alternativa}`;
    })

    alvo.innerHTML += "<br>";
  })
  alvo.querySelectorAll("img").forEach(img => envolveElemento(img, "div"));   
}

function envolveElemento(elt, tag){
  const wrapper = document.createElement(tag);
  elt.parentNode.insertBefore(wrapper, elt);
  wrapper.appendChild(elt)
}

function criaContainer(tag, classe, pai){
  let container = document.createElement(tag);
  container.classList.add(classe);
  pai.appendChild(container);
  return container;
}

function renderizaVersoes(versoes, alvo){
  alvo.innerHTML = "";
  versoes.forEach((versao, i) => {
    let versaoContainer = criaContainer("div", "versao", alvo);
    versaoContainer.innerHTML += `<h2>Versão ${i+1}</h2>`
    
    let questoesContainer = criaContainer("div", "questoes", versaoContainer);
    renderizaQuestoes(versao, questoesContainer);

    let gabarito = geraGabarito(versao);
    renderizaGabarito(gabarito, versaoContainer);
  });
}

function gabaritoParaString(gabarito){
  let tamanhoDasColunas = gabarito.map((letra, idx) => String(idx + 1 ).length + 2);
  let divisoria = "+" + tamanhoDasColunas.map(t => "-".repeat(t)).join("+") + "+\n";
  return (
      divisoria +
      "|" + Array(gabarito.length).fill(0).map((v, idx) => ` ${idx + 1} `).join("|") + "|\n" +
      divisoria +
      "|" + gabarito.map((letra, idx) => centralizaString(letra, tamanhoDasColunas[idx])).join("|") + "|\n" +
      divisoria
  );
}

function centralizaString(str, l){
  str =  str.padStart(str.length + Math.ceil((l - str.length) / 2));
  return str.padEnd(l);
}

function renderizaGabarito(gabarito, alvo){
  let rotulo = document.createElement("label");
  alvo.appendChild(rotulo);
  rotulo.setAttribute("for", "gabarito");
  rotulo.innerText = "Gabarito: ";
  alvo.innerHTML += "<br>";
  
  let gabaritoContainer = criaContainer("textarea", "gabarito", alvo);
  gabaritoContainer.setAttribute("readonly", "true");
  gabaritoContainer.setAttribute("rows", 5);
  gabaritoContainer.setAttribute("wrap", "off");
  gabaritoContainer.setAttribute("name", "gabarito");
  gabaritoContainer.value = gabaritoParaString(gabarito);
}
