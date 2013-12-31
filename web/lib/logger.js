var bytes = require('bytes');

exports.dev = function(tokens, req, res){
  var status = res.statusCode
    , method = req.method
    , len = parseInt(res.getHeader('Content-Length'), 10)
    , status_color = 32
    , method_color = 33;

  if (status >= 500) status_color = 31
  else if (status >= 400) status_color = 33
  else if (status >= 300) status_color = 36;

  if (method === 'GET') method_color = 32
  else if (method === 'POST') method_color = 35

  len = isNaN(len)
    ? ''
    : len = ' - ' + bytes(len);

  return '\x1b[' + method_color + 'm' + req.method
    + '\x1b[m ' + req.originalUrl + ' '
    + '\x1b[' + status_color + 'm' + res.statusCode
    + ' \x1b[m'
    + (new Date - req._startTime)
    + 'ms' + len
};
