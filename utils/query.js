function buildQueryString(query) {
  const params = new URLSearchParams(query);
  params.delete('page');
  return params.toString();
}

module.exports = { buildQueryString };
