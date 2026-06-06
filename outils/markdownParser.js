const { marked } = require('marked');

async function markdownToHtml(markdownContent) {
    if (!markdownContent) return '';
    return await marked.parse(markdownContent);
}

module.exports = { markdownToHtml };