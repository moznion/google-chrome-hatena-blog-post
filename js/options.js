$('#userName').val(localStorage.getItem('userName'));
$('#apiKey').val(localStorage.getItem('apiKey'));
$('#endpointUrl').val(localStorage.getItem('endpointUrl'));
$('#doOpen').val([localStorage.getItem('doOpen')]);
$('#doBreakLine').val([localStorage.getItem('doBreakLine')]);

$('#save').click(function () {
    var userName, apiKey, endpointUrl, wHeader;

    userName    = $('#userName').val();
    apiKey      = $('#apiKey').val();
    endpointUrl = $('#endpointUrl').val();
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

            $('#save').text('保存しました');
            return true;
        },
        error: function () {
            $('#save').text('設定を間違えています');
            return false;
        }
    });
});
