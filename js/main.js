var main;

main = function() {
  "use strict";

  var userName    = 'moznion',
      wssePass    = 'uaiewymixj',
      endpointUri = 'http://local.hatena.ne.jp:3000/moznion/moznion.e.local.hatena.com:3000/atom',
      wHeader     = wsseHeader(userName, wssePass);

  function constructPostXML (userName, title, body, isDraft) {
    var xml = '<?xml version="1.0" encoding="utf-8"?>' +
              '<entry xmlns="http://www.w3.org/2005/Atom"' +
                     'xmlns:app="http://www.w3.org/2007/app">' +
                '<title>' + title + '</title>' +
                '<author><name>' + userName + '</name></author>' +
                '<content type="text/plain">' + body + '</content>' +
                '<app:control>' +
                  '<app:draft>' + isDraft + '</app:draft>' +
                '</app:control>' +
              '</entry>';
    return xml;
  };

  $('#submit').click(function () {
    var title, content;
    title   = $('#title').val();
    content = $('#content').val();

    var xml = constructPostXML(userName, title, content, 'no');
    $.ajax({
      url:  endpointUri + '/entry',
      type: 'post',
      headers: {
        'X-WSSE': wHeader
      },
      contentType: 'text/xml;charset=UTF-8',
      datatype: 'xml',
      data: xml,
      success: function () {
        window.close();
      },
      error: function () {
        $('body').append('<br><font color="red">Post failed...</font>');
      }
    });
  });
};
main();
