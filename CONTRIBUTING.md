# Guia de Contribuição

Obrigado por considerar contribuir para o WhatsApp Chat!

## Como Contribuir

### Reportar Bugs

Se você encontrou um bug:

1. Verifique se o bug já foi reportado nas [Issues](../../issues)
2. Se não, crie uma nova issue incluindo:
   - Título claro e descritivo
   - Passos para reproduzir o problema
   - Comportamento esperado vs atual
   - Screenshots (se aplicável)
   - Informações do ambiente (browser, SO, etc.)

### Sugerir Melhorias

Para sugerir uma nova funcionalidade:

1. Verifique se já não existe uma issue similar
2. Crie uma nova issue descrevendo:
   - O problema que a funcionalidade resolveria
   - Como você imagina que funcionaria
   - Exemplos de uso

### Pull Requests

1. Fork o repositório
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/minha-feature
   ```
3. Faça suas alterações seguindo o guia de estilo
4. Commit suas mudanças:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade X"
   ```
5. Push para sua branch:
   ```bash
   git push origin feature/minha-feature
   ```
6. Abra um Pull Request

### Convenção de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Mudanças na documentação
- `style:` - Formatação, ponto e vírgula faltando, etc
- `refactor:` - Refatoração de código
- `test:` - Adição de testes
- `chore:` - Atualização de dependências, etc

### Guia de Estilo

#### TypeScript/React

- Use TypeScript para todos os arquivos
- Use componentes funcionais com hooks
- Sempre defina tipos/interfaces
- Use nomes descritivos para variáveis e funções
- Adicione comentários para lógica complexa

#### CSS/Tailwind

- Use Tailwind CSS para estilização
- Mantenha classes organizadas
- Use o padrão mobile-first

#### Estrutura de Arquivos

```
app/          # Páginas e rotas da API
components/   # Componentes reutilizáveis
contexts/     # Context providers
hooks/        # Custom hooks
lib/          # Funções utilitárias e configurações
types/        # Definições de tipos TypeScript
```

### Testando

Antes de submeter um PR:

1. Teste a funcionalidade localmente
2. Verifique se não há erros de lint:
   ```bash
   npm run lint
   ```
3. Teste em diferentes navegadores
4. Verifique a responsividade mobile

### Código de Conduta

- Seja respeitoso e construtivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## Dúvidas?

Se tiver alguma dúvida, sinta-se à vontade para:

- Abrir uma issue
- Comentar em issues existentes
- Entrar em contato com os mantenedores

Obrigado por contribuir! 🎉

