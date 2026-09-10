const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function arquivosJavaScript(diretorio) {
    return fs.readdirSync(diretorio, { withFileTypes: true }).flatMap((item) => {
        const caminho = path.join(diretorio, item.name);
        return item.isDirectory() ? arquivosJavaScript(caminho) : [caminho];
    }).filter((arquivo) => arquivo.endsWith('.js'));
}

const raizes = ['src', 'scripts', 'test'];
const arquivos = raizes.flatMap((raiz) => arquivosJavaScript(
    path.join(__dirname, '..', raiz)
));

for (const arquivo of arquivos) {
    const resultado = spawnSync(process.execPath, ['--check', arquivo], {
        encoding: 'utf8'
    });
    if (resultado.status !== 0) {
        process.stderr.write(resultado.stderr);
        process.exit(resultado.status || 1);
    }
}

console.log(`${arquivos.length} arquivos JavaScript verificados sem erro de sintaxe.`);
