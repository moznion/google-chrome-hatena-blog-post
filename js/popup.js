var main = function () {
    "use strict";

    var userName    = localStorage.getItem('userName'),
        apiKey      = localStorage.getItem('apiKey'),
        endpointUrl = localStorage.getItem('endpointUrl'),
        wHeader     = wsseHeader(userName, apiKey);

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

    var View = function () {
        this.$title    = $('#title');
        this.$content  = $('#content');
        this.$isDraft  = $('#isDraft');
        this.$submit   = $('#submit');
        this.$pageInfo = $('#pageInfo');
        this.$gist     = $('#gist');
    };

    View.prototype = {
        entryTitlePrepared: function (title) {
            this.$title.val(title);
        },
        entryContentPrepared: function (content) {
            this.$content.val(content);
        },
        entryDraftPrepared: function (isDraft) {
            this.$isDraft.val([isDraft]);
        }
    };

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
            var blogName = $(xmlServiceDocument).find('title')[0].textContent;

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

    var view    = new View();
    var title   = localStorage.getItem('title');
    var content = localStorage.getItem('content');
    var isDraft = localStorage.getItem('isDraft');
    view.entryTitlePrepared(title);
    view.entryContentPrepared(content);
    view.entryDraftPrepared(isDraft);

    var constructPostXML = function(userName, title, body, isDraft) {
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

    var saveContents = function () {
        localStorage.setItem('title',   view.$title.val());
        localStorage.setItem('content', view.$content.val());
        localStorage.setItem('isDraft', view.$isDraft.filter(':checked').val());
    };
    var saver = setInterval(saveContents, 1000);

    view.$submit.click(function () {
        var title   = view.$title.val();
        var content = view.$content.val();
        var isDraft = 'no';

        // 下書きモード
        if (view.$isDraft.filter(':checked').val() === 'yes') {
            isDraft = 'yes';
        }

        // 見たままモード
        if (localStorage.getItem('doBreakLine') === 'yes') {
            content = content.replace(/(\n|\r)/g, "<br />");
        }

        var xml = constructPostXML(userName, title, content, isDraft);
        var prepareSendEntry = function () {
            var dfd = $.Deferred();
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
                    dfd.resolve(xml_response);
                },
                error: function () {
                    dfd.reject();
                }
            });
            return dfd.promise();
        };

        prepareSendEntry().done(function (xml_response) {
            clearInterval(saver);
            localStorage.removeItem('title');
            localStorage.removeItem('content');
            localStorage.removeItem('isDraft');

            // 公開した場合は当該エントリを開く
            if (view.$isDraft.filter(':checked').length !== 'yes' && localStorage.getItem('doOpen') === 'yes') {
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
        }).fail(function () {
            var notification = $('<div>').addClass('notification');
            notification.append('<font color="red">Post failed...</font>');
            $('div.notification').replaceWith(notification);
        });
    });

    // 閲覧中のページの情報をクリッピングする部分
    view.$pageInfo.click(function () {
        chrome.tabs.getSelected(window.id, function (tab) {
            view.$content.insertAtCaret(tab.title + ' - ' + tab.url);
        });
    });

    // Gist 貼り付け
    chrome.tabs.getSelected(window.id, function (tab) {
        if (tab.url.indexOf('https://gist.github.com/') >= 0) {
            view.$gist.show().on('click', function () {
                var gistId = tab.url.match(/^https:\/\/gist\.github\.com\/.*\/(\d*)/)[1];
                view.$content.insertAtCaret('[gist:' + gistId + ']');
            });
        }
    });
};

var setup = function () {
    return chrome.tabs.create({
        url: chrome.extension.getURL('options.html')
    });
};

if ((localStorage.getItem('userName') && localStorage.getItem('apiKey') && localStorage.getItem('endpointUrl'))) {
    main();
} else {
    setup();
}
