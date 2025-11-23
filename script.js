// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 1. CONSTANTES E ESTADO
  // ==========================================================================

  const canvas = document.getElementById("canvas"); // Seleciona o elemento canvas para a animação.
  const blackholeContainer = document.getElementById("blackhole"); // Container da animação inicial.
  const centerHover = document.querySelector(".centerHover"); // Elemento "ENTER" da animação.
  const searchInput = document.getElementById("search-input"); // Campo de busca.
  const clearSearchButton = document.getElementById("botao-limpar-busca"); // Botão de limpar busca.
  const cardContainer = document.querySelector(".card-container"); // Container para os cards de livros.
  const header = document.querySelector("header"); // Cabeçalho da página.
  const main = document.querySelector("main"); // Conteúdo principal.
  const footer = document.querySelector(".footer"); // Rodapé da página.
  const carouselContainer = document.querySelector(".carousel-container"); // Container do carrossel.
  const quotesCarousel = document.getElementById("quotes-carousel"); // O carrossel de citações em si.

  let livros = []; // Array para armazenar os dados dos livros buscados do JSON.
  let autoRotateInterval; // Variável para controlar o intervalo de rotação automática do carrossel.
  let isAnimationPaused = false; // Controla o estado da animação de fundo (blackhole).
  let animationLoop; // Variável para o loop da animação do canvas.
  let pauseStartTime = 0; // Registra o tempo em que a animação foi pausada.
  let totalPausedTime = 0; // Acumula o tempo total que a animação ficou pausada.

  // ==========================================================================
  // 2. FUNÇÕES DE ANIMAÇÃO
  // ==========================================================================
  /**
   * Anima o placeholder de um elemento de input com um efeito de digitação.
   * @param {HTMLElement} element - O elemento de input.
   * @param {Array<string>} texts - Um array de strings para serem digitadas.
   * @param {number} period - O tempo de pausa em ms após uma palavra ser totalmente digitada.
   */
  const typingEffect = async (element, texts, period = 2000) => {
    let loopNum = 0; // Contador para o loop pelos textos.
    let text = ""; // O texto atual sendo exibido.
    let isDeleting = false; // Flag para indicar se está apagando o texto.

    const tick = () => {
      const i = loopNum % texts.length; // Índice do texto atual no array.
      const fullTxt = texts[i]; // O texto completo a ser digitado.

      if (isDeleting) {
        // Se está apagando, subtrai um caractere.
        text = fullTxt.substring(0, text.length - 1);
      } else {
        // Se está digitando, adiciona um caractere.
        text = fullTxt.substring(0, text.length + 1);
      }

      element.setAttribute("placeholder", text + "|"); // Atualiza o placeholder com o texto e o cursor.

      let delta = 200 - Math.random() * 100; // Define a velocidade de digitação/deleção.

      if (isDeleting) {
        delta /= 2; // Apaga mais rápido.
      }

      // Lógica para alternar entre digitar e apagar.
      if (!isDeleting && text === fullTxt) {
        delta = period;
        isDeleting = true;
      } else if (isDeleting && text === "") {
        isDeleting = false;
        loopNum++;
        delta = 500;
      }

      setTimeout(tick, delta); // Chama a função recursivamente após o tempo 'delta'.
    };

    tick(); // Inicia o efeito.
  };

  /**
   * Lógica da animação de introdução (blackhole).
   * @param {string} element - O seletor do container da animação.
   */
  function blackhole(element) {
    const container = document.querySelector(element);
    if (!container || !canvas) return; // Aborta se os elementos não existirem.

    // Configurações da animação.
    const h = container.offsetHeight; // Altura do container.
    const w = container.offsetWidth; // Largura do container.
    const cw = w; // Largura do canvas.
    const ch = h; // Altura do canvas.
    const maxorbit = 255; // Distância máxima da órbita das estrelas.
    const centery = ch / 2; // Centro Y do canvas.
    const centerx = cw / 2; // Centro X do canvas.

    const startTime = new Date().getTime(); // Tempo inicial da animação.
    let currentTime = 0; // Tempo atual da animação.

    const stars = []; // Array para armazenar as estrelas.
    let collapse = false; // Flag para o efeito de colapso (hover).
    let expanse = false; // Flag para o efeito de expansão (click).

    canvas.width = cw; // Define a largura do canvas.
    canvas.height = ch; // Define a altura do canvas.
    const context = canvas.getContext("2d"); // Contexto de renderização 2D.

    context.globalCompositeOperation = "multiply"; // Efeito de mistura de cores.

    // Função para ajustar a resolução do canvas para telas de alta densidade (retina).
    const setDPI = (canvas, dpi) => {
      const scaleFactor = dpi / 96; // Fator de escala.
      canvas.width = Math.ceil(canvas.width * scaleFactor); // Ajusta a largura real do canvas.
      canvas.height = Math.ceil(canvas.height * scaleFactor); // Ajusta a altura real do canvas.
      const ctx = canvas.getContext("2d"); // Pega o contexto novamente.
      ctx.scale(scaleFactor, scaleFactor); // Escala o conteúdo desenhado.
    };

    // Função para rotacionar um ponto (x, y) em torno de um centro (cx, cy).
    const rotate = (cx, cy, x, y, angle) => {
      const radians = angle; // Ângulo em radianos.
      const cos = Math.cos(radians); // Cosseno do ângulo.
      const sin = Math.sin(radians); // Seno do ângulo.
      const nx = cos * (x - cx) + sin * (y - cy) + cx; // Nova coordenada X.
      const ny = cos * (y - cy) - sin * (x - cx) + cy; // Nova coordenada Y.
      return [nx, ny]; // Retorna as novas coordenadas.
    };

    setDPI(canvas, 192); // Ajusta o DPI do canvas.

    // Classe que define cada estrela da animação.
    class Star {
      constructor() {
        const rands = [
          Math.random() * (maxorbit / 2) + 1,
          Math.random() * (maxorbit / 2) + maxorbit,
        ];
        this.orbital = rands.reduce((p, c) => p + c, 0) / rands.length; // Define uma órbita aleatória.
        this.x = centerx; // Posição X inicial.
        this.y = centery + this.orbital; // Posição Y inicial.
        this.yOrigin = centery + this.orbital; // Posição Y original para retornar.
        this.speed = ((Math.floor(Math.random() * 2.5) + 1.5) * Math.PI) / 180; // Velocidade de rotação.
        this.rotation = 0; // Rotação atual.
        this.startRotation =
          ((Math.floor(Math.random() * 360) + 1) * Math.PI) / 180; // Rotação inicial aleatória.
        this.id = stars.length; // ID da estrela.
        this.collapseBonus = this.orbital - maxorbit * 0.7; // Bônus para o efeito de colapso.
        if (this.collapseBonus < 0) this.collapseBonus = 0; // Garante que não seja negativo.
        this.color = "rgba(255,255,255," + (1 - this.orbital / 255) + ")"; // Cor baseada na órbita (mais distante, mais transparente).
        this.hoverPos = centery + maxorbit / 2 + this.collapseBonus; // Posição no hover.
        this.expansePos =
          centery +
          (this.id % 100) * -10 +
          (Math.floor(Math.random() * 20) + 1); // Posição na expansão.
        this.prevR = this.startRotation; // Rotação anterior.
        this.prevX = this.x; // Posição X anterior.
        this.prevY = this.y; // Posição Y anterior.
        stars.push(this); // Adiciona a estrela ao array.
      }

      // Método para desenhar a estrela no canvas.
      draw() {
        this.rotation = this.startRotation + currentTime * this.speed; // Calcula a nova rotação.
        // Lógica de movimento da estrela baseada nos estados 'collapse' e 'expanse'.
        if (!collapse && !expanse) {
          if (this.y > this.yOrigin) this.y -= 2.5;
          if (this.y < this.yOrigin - 4) this.y += (this.yOrigin - this.y) / 10;
        } else if (collapse) {
          if (this.y > this.hoverPos) this.y -= (this.hoverPos - this.y) / -5;
          if (this.y < this.hoverPos - 4) this.y += 2.5;
        } else if (expanse) {
          this.rotation = this.startRotation + (currentTime * this.speed) / 2;
          if (this.y > this.expansePos)
            this.y -= Math.floor(this.expansePos - this.y) / -80;
        }
        context.save(); // Salva o estado atual do contexto.
        context.strokeStyle = this.color; // Define a cor da linha.
        context.beginPath(); // Inicia um novo caminho de desenho.
        const oldPos = rotate(
          centerx,
          centery,
          this.prevX,
          this.prevY,
          -this.prevR
        );
        context.moveTo(oldPos[0], oldPos[1]); // Move para a posição anterior.
        context.translate(centerx, centery); // Translada para o centro para rotacionar.
        context.rotate(this.rotation); // Rotaciona.
        context.translate(-centerx, -centery); // Translada de volta.
        context.lineTo(this.x, this.y); // Desenha a linha até a nova posição.
        context.stroke(); // Renderiza a linha.
        context.restore(); // Restaura o estado do contexto.
        this.prevR = this.rotation; // Atualiza a rotação anterior.
        this.prevX = this.x; // Atualiza a posição X anterior.
        this.prevY = this.y; // Atualiza a posição Y anterior.
      }
    }

    // Loop principal da animação.
    animationLoop = () => {
      if (isAnimationPaused) return; // Para a animação se estiver pausada.
      const now = new Date().getTime(); // Tempo atual.
      currentTime = (now - startTime - totalPausedTime) / 80; // Calcula o tempo decorrido.
      context.fillStyle = "rgba(25,25,25,0.2)"; // Fundo semi-transparente para criar rastro.
      context.fillRect(0, 0, cw, ch); // Desenha o fundo.
      stars.forEach((star) => star?.draw()); // Desenha cada estrela.
      requestAnimationFrame(animationLoop); // Agenda o próximo frame da animação.
    };

    centerHover.addEventListener("click", () => { // Evento de clique para iniciar a transição.
      collapse = false;
      expanse = true;
      centerHover.classList.add("open");
      showMainContent();
      setTimeout(() => {
        document.body.appendChild(canvas);
        canvas.classList.add("is-background");
        blackholeContainer.style.display = "none";
      }, 1500);
    });

    centerHover.addEventListener("mouseover", () => {
      if (!expanse) collapse = true;
    });

    centerHover.addEventListener("mouseout", () => {
      if (!expanse) collapse = false;
    });

    context.fillStyle = "rgba(25,25,25,1)";
    context.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 2500; i++) new Star();
    animationLoop();
  }

  // ==========================================================================
  // 3. FUNÇÕES DE DADOS E LÓGICA PRINCIPAL
  // ==========================================================================
  /**
   * Busca os dados dos livros do arquivo JSON.
   */
  async function fetchLivros() {
    try {
      const response = await fetch("data.json"); // Faz a requisição para o arquivo data.json.
      if (!response.ok) { // Verifica se a requisição foi bem-sucedida.
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      livros = await response.json(); // Converte a resposta para JSON e armazena no array 'livros'.
      popularCarrossel(livros); // Popula o carrossel com os dados carregados.
      iniciarRotacaoAutomatica(); // Inicia a rotação automática do carrossel.

      // Prepara os títulos para o efeito de digitação no placeholder.
      const titulosParaDigitacao = livros
        .slice(0, 5)
        .map((livro) => livro.titulo);
      setTimeout(() => typingEffect(searchInput, titulosParaDigitacao), 3000); // Inicia o efeito após 3 segundos.
    } catch (error) {
      console.error("Falha na conexão com a Nebulosa de Dados:", error); // Exibe erro no console.
      cardContainer.innerHTML = `<p class="mensagem-nenhum-resultado">Falha na conexão com a Nebulosa de Dados. Tente novamente mais tarde.</p>`;
    }
  }

  /**
   * Filtra os livros com base no termo de busca e atualiza a UI.
   */
  function buscarLivros() {
    const termoBusca = searchInput.value.toLowerCase().trim(); // Pega o valor da busca, converte para minúsculas e remove espaços.

    if (termoBusca === "") {
      cardContainer.classList.add("fading-out"); // Adiciona classe para animação de saída dos cards.
      setTimeout(() => { // Após a animação, esconde os cards e mostra o carrossel.
        carouselContainer.style.display = "none";
        void carouselContainer.offsetWidth;
        carouselContainer.style.display = "flex";
        cardContainer.style.display = "none";
        cardContainer.classList.remove("fading-out");
        cardContainer.innerHTML = "";
      }, 400);
      clearSearchButton.classList.add("escondido"); // Esconde o botão de limpar.
      return;
    }

    clearSearchButton.classList.remove("escondido"); // Mostra o botão de limpar.
    carouselContainer.style.display = "none"; // Esconde o carrossel.
    cardContainer.style.display = "grid"; // Mostra o container de cards.

    // Filtra o array 'livros' para encontrar títulos que começam com o termo da busca.
    const resultados = livros.filter((livro) =>
      livro.titulo.toLowerCase().startsWith(termoBusca)
    );

    exibirCards(resultados); // Exibe os resultados encontrados.
  }

  // ==========================================================================
  // 4. FUNÇÕES DE UI (INTERFACE DO USUÁRIO)
  // ==========================================================================
  /**
   * Popula o carrossel com citações dos livros.
   * @param {Array} dadosLivros - O array de objetos de livros.
   */
  function popularCarrossel(dadosLivros) {
    // Filtra apenas os livros que têm uma citação
    const livrosComCitacao = dadosLivros.filter((livro) => livro.citacao); // Filtra livros com citação.
    quotesCarousel.innerHTML = ""; // Limpa o conteúdo anterior do carrossel.

    if (livrosComCitacao.length > 0) {
      livrosComCitacao.forEach((livro, index) => {
        const blockquote = document.createElement("blockquote");
        if (index === 0) { // Adiciona a classe 'active' ao primeiro item para que ele seja o inicial.
          blockquote.classList.add("active");
        }

        blockquote.innerHTML = `
          <div>
            <p>“${livro.citacao}”</p>
            <cite>— ${livro.titulo}</cite>
          </div>
        `; // Cria o HTML para cada citação.
        quotesCarousel.appendChild(blockquote);
      });
    }
  }

  /**
   * Cria e retorna o elemento HTML para um card de livro.
   * @param {Object} livro - O objeto do livro.
   * @returns {HTMLElement} O elemento article do card.
   */
  function criarCard(livro) {
    const article = document.createElement("article"); // Cria o elemento <article> para o card.
    article.innerHTML = `
      <div class="card-inner">
        <div class="card-front"><h2>${livro.titulo}</h2></div>
        <div class="card-back"><div class="card-content"><p>${livro.sinopse}</p><a href="${livro.link_goodreads}" target="_blank">Ver no Goodreads</a></div></div>
      </div>
    `;
    return article;
  }

  /**
   * Exibe os cards de livros na tela.
   * @param {Array} livrosParaExibir - A lista de livros a ser exibida.
   */
  function exibirCards(livrosParaExibir) {
    cardContainer.innerHTML = ""; // Limpa os resultados anteriores.

    if (livrosParaExibir.length === 0) {
      cardContainer.innerHTML = `<div class="mensagem-container"><p class="mensagem-nenhum-resultado">Nossos sensores varreram a galáxia e não encontraram registros com esse nome.</p></div>`; // Mensagem de erro se não houver resultados.
    } else {
      livrosParaExibir.forEach((livro) => {
        const card = criarCard(livro); // Cria o card para cada livro.
        cardContainer.appendChild(card); // Adiciona o card ao container.
      });
    }

    clearSearchButton.classList.toggle( // Mostra ou esconde o botão de limpar com base no conteúdo da busca.
      "escondido",
      searchInput.value.length === 0
    );
  }

  /**
   * Inicia a rotação automática do carrossel.
   */
  function iniciarRotacaoAutomatica() {
    // Limpa qualquer intervalo anterior para evitar múltiplos loops.
    clearInterval(autoRotateInterval);
    // Define um novo intervalo para chamar a função 'avancarSlide' a cada 5 segundos.
    autoRotateInterval = setInterval(avancarSlide, 5000); // 5000ms = 5 segundos.
  }

  /**
   * Avança para o próximo slide no carrossel.
   */
  function avancarSlide() {
    const slides = quotesCarousel.querySelectorAll("blockquote"); // Pega todos os slides.
    if (slides.length <= 1) return; // Não faz nada se houver 1 ou nenhum slide.

    let currentIndex = -1; // Inicializa o índice atual.
    slides.forEach((slide, index) => {
      if (slide.classList.contains("active")) { // Encontra o slide ativo.
        currentIndex = index;
        slide.classList.remove("active"); // Remove a classe 'active' dele.
      }
    });

    let nextIndex = currentIndex + 1; // Calcula o próximo índice.
    if (nextIndex >= slides.length) {
      nextIndex = 0; // Volta para o primeiro slide se chegar ao fim.
    }

    slides[nextIndex].classList.add("active");
  }

  /**
   * Cria e adiciona o botão de controle da animação ao cabeçalho.
   */
  function criarBotaoControleAnimacao() {
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "toggle-animation-btn"; // ID do botão.
    toggleBtn.classList.add("animation-control-btn"); // Classe para estilização.
    toggleBtn.title = "Pausar/Retomar Animação"; // Tooltip do botão.
    toggleBtn.setAttribute("aria-checked", "false"); // Estado inicial: tocando
    toggleBtn.innerHTML = `<span></span>`; // Estrutura para os ícones de play/pause em CSS.

    toggleBtn.addEventListener("click", () => {
      isAnimationPaused = !isAnimationPaused; // Inverte o estado de pausa.
      toggleBtn.setAttribute("aria-checked", isAnimationPaused); // Atualiza o atributo para o CSS.

      if (isAnimationPaused) {
        pauseStartTime = new Date().getTime(); // Registra quando a pausa começou.
      } else {
        totalPausedTime += new Date().getTime() - pauseStartTime; // Acumula o tempo pausado.
        requestAnimationFrame(animationLoop); // Reinicia o loop de animação.
      }
    });

    header.appendChild(toggleBtn); // Adiciona o botão ao cabeçalho.
  }

  // --- INICIALIZAÇÃO ---
  /**
   * Prepara a estrutura do input de busca para o novo estilo.
   */
  function prepararInputBusca() {
  const searchContainer = document.querySelector(".search-container");
  const inputWrapper = document.createElement("div"); // Cria o div wrapper.
  inputWrapper.className = "input-wrapper"; // Adiciona a classe.

  const glowSpan = document.createElement("span"); // Cria o span para o efeito de brilho.

  // Move o searchInput para dentro do novo wrapper.
  searchContainer.insertBefore(inputWrapper, searchInput); // Insere o wrapper antes do input.
  inputWrapper.appendChild(searchInput); // Move o input para dentro do wrapper.
  inputWrapper.appendChild(glowSpan); // Adiciona o span de brilho ao wrapper.
  }

  /**
   * Mostra o conteúdo principal com um efeito de fade-in.
   */
  function showMainContent() {
    document.body.style.overflow = "auto"; // Permite a rolagem da página.
    // Altera a opacidade e visibilidade para mostrar o conteúdo com fade-in (definido no CSS).
    header.style.opacity = "1"; main.style.opacity = "1"; footer.style.opacity = "1";
    header.style.visibility = "visible"; main.style.visibility = "visible"; footer.style.visibility = "visible";

    criarBotaoControleAnimacao();
  }

  // ==========================================================================
  // 5. MANIPULADORES DE EVENTOS
  // ==========================================================================

  function vincularEventos() {
    // Evento de clique no botão de limpar busca.
    clearSearchButton.addEventListener("click", () => {
      searchInput.value = ""; // Limpa o campo.
      buscarLivros(); // Chama a busca para resetar a UI.
      searchInput.focus(); // Devolve o foco ao campo.
    });

    // Evento de digitação no campo de busca para busca em tempo real.
    searchInput.addEventListener("input", buscarLivros);

    // Evento de foco no campo de busca para animar o placeholder.
    searchInput.addEventListener("focus", () => {
      searchInput.classList.add("placeholder-fade-out");
    });
    // Evento de perda de foco no campo de busca.
    searchInput.addEventListener("blur", () => { // Se o campo estiver vazio, o placeholder volta a aparecer.
      if (searchInput.value === "") {
        searchInput.classList.remove("placeholder-fade-out");
      }
    });

    // Pausa a rotação automática quando o mouse está sobre o carrossel.
    quotesCarousel.addEventListener("mouseenter", () => clearInterval(autoRotateInterval));
    // Reinicia a rotação automática quando o mouse sai.
    quotesCarousel.addEventListener("mouseleave", iniciarRotacaoAutomatica);
  }

  // ==========================================================================
  // 6. INICIALIZAÇÃO
  // ==========================================================================
  clearSearchButton.classList.add("escondido");
  prepararInputBusca();
  fetchLivros(); // Busca os dados dos livros.
  vincularEventos(); // Adiciona todos os event listeners.
  blackhole("#blackhole"); // Inicia a animação de introdução.
});
