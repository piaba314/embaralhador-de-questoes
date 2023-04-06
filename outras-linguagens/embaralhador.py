#!/usr/bin/env python3

import re
import random
import copy
import sys
import os

delimitador_questoes = r"^\s*[0-9]+\."
delimitador_alternativas = r"\s*^[a-z]\)"

def string_para_prova(string):
    prova = {}
    questoes_string = re.split(delimitador_questoes, string, flags = re.MULTILINE)
    prova["preambulo"] = questoes_string[0]
    prova["questoes"] = []
    for qs in questoes_string[1:]:
        partes = [p.strip() for p in re.split(delimitador_alternativas, qs, flags = re.MULTILINE)]
        prova["questoes"].append({
            "enunciado": partes[0],
            "alternativas": partes[1:]
        })
    return prova

def prova_para_string(prova):
    return prova["preambulo"] + "\n\n".join([
        f"{idx+1}. {q['enunciado']}\n{alternativas_para_string(q['alternativas'])}"
        for idx, q in enumerate(prova["questoes"])
    ])

def alternativas_para_string(alternativas):
    return "\n".join([f"{chr(idx + 97)}) {alt}" for idx, alt in enumerate(alternativas)])

def carrega_prova(nome_do_arquivo):
    with open(nome_do_arquivo) as arquivo:
        return string_para_prova(arquivo.read())

def salva_prova(prova, nome_do_arquivo):
    with open(nome_do_arquivo, "w") as arquivo:
        arquivo.write(prova_para_string(prova))

def embaralha_questoes(prova):
    nova_prova = copy.deepcopy(prova)
    random.shuffle(nova_prova["questoes"])
    return nova_prova

def embaralha_alternativas(prova):
    nova_prova = copy.deepcopy(prova)
    for q in nova_prova["questoes"]:
        random.shuffle(q["alternativas"])
    return nova_prova

def embaralha_tudo(prova):
    return embaralha_alternativas(embaralha_questoes(prova))

def embaralha_sem_repetir_posicoes(prova, n):
    provas = []
    contagem = 0
    while contagem < n:
        nova_prova = embaralha_tudo(prova)
        if not True in [elemento_mesma_posicao(nova_prova['questoes'], p['questoes']) for p in provas]:
            provas.append(nova_prova)
            contagem += 1
    return provas

def elemento_mesma_posicao(l1, l2):
    for i in range(len(l1)):
        if l1[i] == l2[i]:
            return True
    return False

if __name__ == "__main__":
    nome_do_arquivo = sys.argv[1]
    nome_sem_extensao, extensao = os.path.splitext(nome_do_arquivo)
    prova = carrega_prova(nome_do_arquivo)
    for i, p in enumerate(embaralha_sem_repetir_posicoes(prova, 3)):
        salva_prova(p, f"{nome_sem_extensao}-v{i+1}{extensao}")
