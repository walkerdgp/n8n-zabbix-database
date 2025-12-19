var req = new HttpRequest();
var baseUrl = 'https://your_webhook_n8n'; //CHANGE AUTH CONFIG, IT'S NOT IMPLEMENTED

// Converte o value (string JSON) em objeto
var data = {};
try {
    data = JSON.parse(value);
} catch (e) {
    Zabbix.log(4, "JSON parse error: " + e);
}

function safe(v){ return v ? encodeURIComponent(v) : ''; }

var qs =
  '?date='      + safe(data.date) +
  '&eventid='   + safe(data.eventid) +
  '&hostip='    + safe(data.hostip) +
  '&hostname='  + safe(data.hostname) +
  '&problem='   + safe(data.problem) +
  '&severity='  + safe(data.severity) +
  '&status='  + safe(data.status) +
  '&time='      + safe(data.time);

var finalUrl = baseUrl + qs;

Zabbix.log(4, "[DEBUG] URL: " + finalUrl);

var status = req.post(finalUrl, '');
return status;
