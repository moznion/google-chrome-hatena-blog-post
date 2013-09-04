$('#userName').val(localStorage.getItem('userName'));
$('#wssePass').val(localStorage.getItem('wssePass'));
$('#endpointUrl').val(localStorage.getItem('endpointUrl'));

$('#save').click(function () {
  var userName, wssePass, endpointUrl, wHeader;

  userName    = $('#userName').val();
  wssePass    = $('#wssePass').val();
  endpointUrl = $('#endpointUrl').val();

  if (!(userName && wssePass && endpointUrl)) {
    return false;
  }

  wHeader = wsseHeader(userName, wssePass);
  $.ajax({
    url:  endpointUrl,
    type: 'get',
    headers: {
      'X-WSSE': wHeader
    },
    datatype: 'xml',
    success: function (xmlData) {
      serviceDocument = xmlData;
      blogName = $(serviceDocument).find('title').text();

      localStorage.setItem('blogName', blogName);
      localStorage.setItem('userName',    userName);
      localStorage.setItem('wssePass',    wssePass);
      localStorage.setItem('endpointUrl', endpointUrl);

      $('#save').text('保存しました');
      return true;
    },
    error: function () {
      $('#save').text('設定を間違えています');
      return false;
    }
  });
});
