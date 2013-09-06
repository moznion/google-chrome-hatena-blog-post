var main,
setup;

main = function() {
    "use strict";

    var userName    = localStorage.getItem('userName'),
        apiKey      = localStorage.getItem('apiKey'),
        endpointUrl = localStorage.getItem('endpointUrl'),
        title       = localStorage.getItem('title'),
        content     = localStorage.getItem('content'),
        isDraft     = localStorage.getItem('isDraft'),
        wHeader     = wsseHeader(userName, apiKey),
        saveContents,
        constructPostXML,
        blogName,
        saver;

    $.fn.extend({
        insertAtCaret: function(v) {
            var o = this.get(0);
            o.focus();
            var s = o.value;
            var p = o.selectionStart;
            var np = p + v.length;
            o.value = s.substr(0, p) + v + s.substr(p);
            o.setSelectionRange(np, np);
        }
    });

    var prepareBlogTitle = function () {
        var dfd = $.Deferred();

        var blogName = localStorage.getItem('blogName');

        if (blogName) {
            dfd.resolve(blogName);
            return dfd.promise();
        }

        $.ajax({
            url:  endpointUrl,
            type: 'get',
            headers: {
                'X-WSSE': wHeader
            },
            datatype: 'xml'
        }).done(function (xmlServiceDocument) {
            blogName = $(xmlServiceDocument).find('title')[0].textContent;

            if (blogName.length >= 15) {
                blogName = blogName.slice(0, 15) + '...';
            }

            localStorage.setItem('blogName', blogName);

            dfd.resolve(blogName);
        });

        return dfd.promise();
    };

    prepareBlogTitle().done(function (blogName) {
        $('<h3>').text(blogName).insertAfter('#top');
    });

    $('#title').val(title);
    $('#content').val(content);
    $('#isDraft').val([isDraft]);

    constructPostXML = function(userName, title, body, isDraft) {
        var xml_template = '<?xml version="1.0" encoding="utf-8"?>' +
            '<entry xmlns="http://www.w3.org/2005/Atom"' +
            'xmlns:app="http://www.w3.org/2007/app">' +
            '<title><%- data.title %></title>' +
            '<author><name><%- data.userName %></name></author>' +
            '<content type="text/plain"><%- data.body %></content>' +
            '<app:control>' +
            '<app:draft><%- data.isDraft %></app:draft>' +
            '</app:control>' +
            '</entry>';
        var xml = _.template(xml_template)({
            data: {
                userName: userName,
                title:    title,
                body:     body,
                isDraft:  isDraft
            }
        });
        return xml;
    };

    saveContents = function() {
        var title, content, isDraft;
        title   = $('#title').val();
        content = $('#content').val();
        isDraft = $('#isDraft:checked').val();

        localStorage.setItem('title', title);
        localStorage.setItem('content', content);
        localStorage.setItem('isDraft', isDraft);
    };
    saver = setInterval(saveContents, 1000);

    $('#submit').click(function () {
        var title, content, isDraft;
        title   = $('#title').val();
        content = $('#content').val();
        isDraft = 'no';

        if ($('#isDraft:checked').val() === 'yes') {
            isDraft = 'yes';
        }

        // 見たままモード
        if (localStorage.getItem('doBreakLine') === 'yes') {
            content = content.replace(/(\n|\r)/g, "<br />");
        }

        var xml = constructPostXML(userName, title, content, isDraft);
        $.ajax({
            url:  endpointUrl + '/entry',
            type: 'post',
            headers: {
                'X-WSSE': wHeader
            },
            contentType: 'text/xml;charset=UTF-8',
            datatype: 'xml',
            data: xml,
            success: function (xml_response) {
                clearInterval(saver);
                localStorage.setItem('title', '');
                localStorage.setItem('content', '');
                localStorage.setItem('isDraft', '');

                // 公開した場合は当該エントリを開く
                if ($('#isDraft:checked').length !== 'yes' && localStorage.getItem('doOpen') === 'yes') {
                    $(xml_response).find('link').each(function (i,val) {
                        if($(val).attr('rel') === 'alternate'){
                            chrome.tabs.create({
                                url:      $(val).attr('href'),
                                selected: true
                            });
                        }
                    });
                }

                window.close();
            },
            error: function () {
                $('body').append('<br><font color="red">Post failed...</font>');
            }
        });
    });

    $('#pageInfo').click(function () {
        chrome.tabs.getSelected(window.id, function (tab) {
            $('#content').insertAtCaret(tab.title + ' - ' + tab.url);
        });
    });
    chrome.tabs.getSelected(window.id, function (tab) {
        if(tab.url.indexOf('https://gist.github.com/') >= 0){
            $('#gist').show().on('click', function () {
                var gistId = tab.url.match(/^https:\/\/gist\.github\.com\/.*\/(\d*)/)[1];
                $('#content').insertAtCaret('[gist:' + gistId + ']');
            })
        }
    });
};

setup = function() {
    return chrome.tabs.create({
        url: chrome.extension.getURL('options.html')
    });
};

if ((localStorage.getItem('userName') && localStorage.getItem('apiKey') && localStorage.getItem('endpointUrl'))) {
    main();
} else {
    setup();
}
