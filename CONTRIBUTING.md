# Contribuindo para C-Money

Agradeço o interesse em contribuir! Este documento orienta como colaborar com o projeto.

## 🐛 Reportar Bugs

Se encontrou um bug:
1. Verifique se já não foi reportado em [Issues](https://github.com/seu-usuario/projeto-web/issues)
2. Se for novo, abra uma issue descrevendo:
   - O comportamento esperado
   - O comportamento observado
   - Passos para reproduzir
   - Informações do sistema (OS, versão Python, etc)

## ✨ Sugestões e Melhorias

Ideias para melhorias são bem-vindas! Abra uma issue descrevendo:
- O problema ou caso de uso
- Por que é importante
- Possível solução (opcional)

## 🔧 Desenvolvimento

### Setup Local

```bash
# Clone e configure
git clone https://github.com/HappyFelizz/c-money.git
cd c-money
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Execute os testes
pytest tests/
```

### Workflow de Contribuição

1. **Fork** o repositório
2. **Crie uma branch** para sua feature:
   ```bash
   git checkout -b feature/sua-feature
   ```
3. **Faça seus commits** com mensagens claras:
   ```bash
   git commit -m "Adiciona autenticação de usuário"
   ```
4. **Push** para sua branch:
   ```bash
   git push origin feature/sua-feature
   ```
5. **Abra um Pull Request** descrevendo suas mudanças

## 📋 Padrões de Código

- Use **nomes descritivos** para variáveis e funções
- Adicione **docstrings** em funções complexas
- Mantenha **funções pequenas** e focadas
- Siga a estrutura existente do projeto
- Escreva **testes** para novas funcionalidades

## 📝 Mensagens de Commit

Use formato claro:
```
Tipo: Descrição breve

Descrição mais detalhada (opcional)
- Ponto 1
- Ponto 2
```

Tipos sugeridos:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `refactor:` Refatoração sem mudança funcional
- `test:` Adiciona testes
- `style:` Formatação/lint

## 📖 Documentação

Ao adicionar features:
- Atualize o README.md
- Documente as mudanças em comentários de código
- Adicione exemplos de uso se aplicável

## ✅ Antes de Submeter

- [ ] Testes passam: `pytest tests/`
- [ ] Código segue o estilo do projeto
- [ ] Sem arquivos desnecessários adicionados
- [ ] Commit messages são claras
- [ ] Pull request descreve as mudanças

## 📄 Licença

Ao contribuir, você concorda que seus trabalhos serão licenciados sob a licença MIT do projeto.

---

Obrigado por contribuir! 🎉
