import {
  findLangInlineMissingForeignSpanSnippet,
  findLangInvalidLangAttributeSnippet,
} from './accessibility-heuristics';

const SPANISH_50_PLUS = `<span>El reconocimiento del merito literario de una obra no depende unicamente de la moda o de los premios contemporaneos sino de la capacidad del texto para resonar con multiples generaciones de lectores a lo largo del tiempo. Las novelas que sobreviven al paso de los siglos suelen combinar una prosa clara con conflictos humanos universales que trascienden el contexto historico en el que fueron escritas originalmente. La traduccion fiel preserva el tono y el ritmo del autor sin sacrificar la comprension del lector moderno. Los criticos deben evaluar tanto la forma como el fondo sin reducir la lectura a una lista de simbolos aislados.</span>`;

describe('accessibility-heuristics lang scan helpers', () => {
  it('findLangInlineMissingForeignSpanSnippet detects long foreign span without lang', () => {
    const snip = findLangInlineMissingForeignSpanSnippet(
      `<p>${SPANISH_50_PLUS}</p>`,
    );
    expect(snip).toBeTruthy();
    expect(snip).toContain('reconocimiento');
  });

  it('findLangInlineMissingForeignSpanSnippet skips span with lang', () => {
    const inner = SPANISH_50_PLUS.replace(/^<span>/i, '').replace(
      /<\/span>$/i,
      '',
    );
    expect(
      findLangInlineMissingForeignSpanSnippet(
        `<p><span lang="es">${inner}</span></p>`,
      ),
    ).toBeNull();
  });

  it('findLangInlineMissingForeignSpanSnippet skips short English span', () => {
    expect(
      findLangInlineMissingForeignSpanSnippet(
        '<p><span>Hello world only.</span></p>',
      ),
    ).toBeNull();
  });

  it('findLangInvalidLangAttributeSnippet flags non-canonical lang token', () => {
    const snip = findLangInvalidLangAttributeSnippet(
      '<p><span lang="english">x</span></p>',
    );
    expect(snip).toBeTruthy();
    expect(snip).toMatch(/lang=\"english\"/i);
  });

  it('findLangInvalidLangAttributeSnippet skips valid lang', () => {
    expect(
      findLangInvalidLangAttributeSnippet(
        '<p><span lang="en">x</span></p>',
      ),
    ).toBeNull();
  });
});
