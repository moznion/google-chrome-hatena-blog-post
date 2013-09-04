var main,
    setup;

main = function() {
  "use strict";

  var userName    = localStorage.getItem('userName'),
      wssePass    = localStorage.getItem('wssePass'),
      endpointUrl = localStorage.getItem('endpointUrl'),
      wHeader     = wsseHeader(userName, wssePass),
      constructPostXML,
      serviceDocument,
      blogName;

  blogName = localStorage.getItem('blogName');
  if (!blogName) {
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
        $('<h3>' + blogName + '</h3>').insertAfter('#top');
      },
      error: function () {
      }
    });
  } else {
    $('<h3>' + blogName + '</h3>').insertAfter('#top');
  }

  constructPostXML = function(userName, title, body, isDraft) {
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
      url:  endpointUrl + '/entry',
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

setup = function() {
  return chrome.tabs.create({
    url: chrome.extension.getURL('options.html')
  });
};

if ((localStorage.getItem('userName') && localStorage.getItem('wssePass') && localStorage.getItem('endpointUrl'))) {
  main();
} else {
  setup();
}
