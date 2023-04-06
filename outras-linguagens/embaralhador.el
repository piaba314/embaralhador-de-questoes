(defun cria-questao (enunciado &optional alternativas)
  "Cria uma questão com enunciado e alternativa (opcional)."
  (list :enunciado enunciado :alternativas alternativas))

(cl-defun cria-prova (questoes &optional (preambulo ""))
  "Cria uma prova a partir de uma lista de questões."
  (list :questoes questoes :preambulo preambulo))

(defun embaralha-lista (lst)
  "Retorna uma permutação aleatória dos elementos da lista lst."
  (if (null lst)
      '()
    (let ((n (random (length lst))))
      (cons (nth n lst)
	    (embaralha-lista (remove-n-esimo n lst))))))

(defun embaralha-lista-sem-repetir-posicoes (lst n)
  "Retorna uma lista de n permutações aletórias de lst sem elementos na mesma posição."
  (let ((resultado '()) (contagem 0))
    (while (< contagem n)
      (let ((p (embaralha-lista lst)))
	(when (not (cl-find-if #'(lambda (s)
				   (elemento-mesma-posicao-p p s))
			       resultado))
	  (push p resultado)
	  (setq contagem (+ contagem 1)))))
    resultado))

(defun elemento-mesma-posicao-p (lst1 lst2)
  "Verifica se duas listas tem algum elemento na mesma posição."
  (cond ((or (null lst1) (null lst2)) nil)
	((equal (car lst1) (car lst2)) t)
	(t (elemento-mesma-posicao-p (cdr lst1) (cdr lst2)))))
      
(defun remove-n-esimo (n lst)
  "Retorna cópia de lst sem o n-ésimo elemento."
  (if (= n 0)
      (cdr lst)
    (cons (car lst) (remove-n-esimo (- n 1) (cdr lst)))))

(defun embaralha-alternativas (prova)
  "Embaralha alternativas de uma prova."
  (cria-prova (mapcar #'(lambda (q)
			  (cria-questao (cl-getf q :enunciado)
					(embaralha-lista (cl-getf q :alternativas))))
		      (cl-getf prova :questoes))
	      (cl-getf prova :preambulo)))

(defun embaralha-questoes (prova)
  "Embaralha as questões de uma prova."
  (cria-prova (embaralha-lista (cl-getf prova :questoes))
	      (cl-getf prova :preambulo)))

(defun embaralha-tudo (prova)
  "Embaralha questões e alternativas de uma prova."
  (embaralha-questoes (embaralha-alternativas prova)))

(defun prova-para-string (prova)
  "Imprime uma prova na forma de string."
  (format "%s%s"
	  (cl-getf prova :preambulo)
	  (apply #'concat (let ((idx 0))
			    (mapcar #'(lambda (q)
					(setq idx (+ idx 1))
					(format "%d. %s\n" idx
						(questao-para-string q)))
				    (cl-getf prova :questoes))))))

(defun questao-para-string (questao)
  "Imprime uma questão na forma de uma string."
  (format "%s\n%s" (cl-getf questao :enunciado)
	  (apply #'concat (let ((letra 96))
			    (mapcar #'(lambda (alt)
					(setq letra (+ letra 1))
					(format "%c) %s\n" letra alt))
				    (cl-getf questao :alternativas))))))

(defvar *separador-questoes* "^\s*[0-9]+\."
  "Expressão regular que delimita o início de uma questão.")

(defvar *separador-alternativas* "^\s*[a-z])"
  "Expressão regular que delimita o início de uma alternativa.")

(defun string-para-prova (string)
  "Extrai prova de uma string."
  (let* ((pedacos (split-string string *separador-questoes*))
	 (preambulo (car pedacos))
	 (questoes (mapcar #'(lambda (pedaco)
			       (let* ((partes (mapcar #'string-trim (split-string pedaco *separador-alternativas*)))
				      (enunciado (car partes))
				      (alternativas (cdr partes)))
				 (cria-questao enunciado alternativas)))
			   (cdr pedacos))))
    (cria-prova questoes preambulo)))

(defun transforma-prova-buffer (f)
  "Aplica a função f na prova contida no buffer atual."
  (let ((posicao (point))
        (novo-conteudo (prova-para-string
                        (funcall f
                        (string-para-prova
                        (buffer-substring-no-properties (point-min) (point-max)))))))
    (erase-buffer)
    (insert novo-conteudo)
    (goto-char posicao)))

(defun embaralha-alternativas-buffer ()
  "Embaralha as alternativas da prova contida no buffer atual."
  (interactive)
  (transforma-prova-buffer #'embaralha-alternativas))

(defun embaralha-questoes-buffer ()
  "Embaralha questões da prova no buffer atual."
  (interactive)
  (transforma-prova-buffer #'embaralha-questoes))

(defun embaralha-tudo-buffer ()
  "Embaralha questões e alternativas no buffer atual."
  (interactive)
  (transforma-prova-buffer #'embaralha-tudo))

(defun gera-provas (prova n)
  "Retorna uma lista de n provas aletórias sem questões na mesma posição."
  (mapcar #'(lambda (qs)
	      (embaralha-alternativas (cria-prova qs (cl-getf prova :preambulo))))
	  (embaralha-lista-sem-repetir-posicoes (cl-getf prova :questoes) n)))

(defun gera-provas-buffer (n)
  "Gera n provas cada uma com seu próprio buffer."
  (interactive (list (read-number "Número de provas: ")))
  (let ((nome (file-name-sans-extension (buffer-name)))
	(extensao (file-name-extension (buffer-name)))
	(provas (gera-provas (string-para-prova (buffer-substring-no-properties (point-min) (point-max))) n)))
    (cl-loop for prova in provas
	     for idx from 1 do
	     (with-current-buffer (generate-new-buffer (format "%s-%d.%s" nome idx extensao))
	       (insert (prova-para-string prova))))))
