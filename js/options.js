var View = function () {
    this.$userName    = $('#userName');
    this.$apiKey      = $('#apiKey');
    this.$endpointUrl = $('#endpointUrl');
    this.$doOpen      = $('#doOpen');
    this.$doBreakLine = $('#doBreakLine');
    this.$save        = $('#save');
};

var view = new View();

view.$userName.val(localStorage.getItem('userName'));
view.$apiKey.val(localStorage.getItem('apiKey'));
view.$endpointUrl.val(localStorage.getItem('endpointUrl'));
view.$doOpen.val([localStorage.getItem('doOpen')]);
view.$doBreakLine.val([localStorage.getItem('doBreakLine')]);

view.$save.click(function () {
    var userName, apiKey, endpointUrl, wHeader;

    userName    = view.$userName.val();
    apiKey      = view.$apiKey.val();
    endpointUrl = view.$endpointUrl.val();
    doOpen      = $('#doOpen:checked').val();
    doBreakLine = $('#doBreakLine:checked').val();

    if (!(userName && apiKey && endpointUrl)) {
        return false;
    }

    wHeader = wsseHeader(userName, apiKey);
    $.ajax({
        url:  endpointUrl,
        type: 'get',
        headers: {
            'X-WSSE': wHeader
        },
        datatype: 'xml',
        success: function (xmlData) {
            serviceDocument = xmlData;
            blogName = $(serviceDocument).find('title')[0].textContent;

            if (blogName.length >= 15) {
                blogName = blogName.slice(0, 15) + '...';
            }

            localStorage.setItem('blogName',    blogName);
            localStorage.setItem('userName',    userName);
            localStorage.setItem('apiKey',      apiKey);
            localStorage.setItem('endpointUrl', endpointUrl);
            localStorage.setItem('doOpen',      doOpen);
            localStorage.setItem('doBreakLine', doBreakLine);

            view.$save.text('保存しました');
            return true;
        },
        error: function () {
            view.$save.text('設定を間違えています');
            return false;
        }
    });
});
