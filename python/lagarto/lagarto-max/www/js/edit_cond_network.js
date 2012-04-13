/* Copyright (c) Daniel Berenguer (panStamp) 2012 */

var statement, statementType, servers = [];
var endpointTypes = {};

/**
 * Update values
 */
function updateValues()
{
  statement = window.parent.statement;
  statementType = window.parent.document.getElementById("type").value;
  var operator = document.getElementById("operator");

  var jsonDoc = getJsonDoc();
  servers = jsonDoc.http_servers;

  var elemCount = 0;
  for (elem in servers)
    elemCount++;

  if (elemCount > 0)
    fillServers(servers);

  if (statementType == "trigger")
    operator.options[operator.options.length] = new Option("On Change", "on change");

  operator.value = statement[2];
}

/**
 * Fill server list
 */
function fillServers(servers)
{
  var dot = statement[1].indexOf(".");
  var currVal = statement[1].substring(0, dot);
  var currValFound = false;
  var fldServer = document.getElementById("server");

  if (currVal == "")
    currValFound = true;

  fldServer.options.length = 0;
  for(var server in servers)
  {
    if (!currValFound)
    {
      if (server == currVal)
        currValFound = true;
    }

    fldServer.options[fldServer.options.length] = new Option(server, servers[server]);
  }
  if (!currValFound)
    fldServer.options[fldServer.options.length] = new Option(currVal, "");

  document.getElementById("server").value = currVal;

  onchangeServer();
}

/**
 * Fill endpoints in item1
 */
function fillEndpoints()
{
  var dot = statement[1].indexOf(".");
  var currVal = statement[1].substring(dot+1);
  var currValFound = false;
  var fldEndp = document.getElementById("endp");
  var jsonDoc = getJsonDoc();
  var swapnet = jsonDoc.lagarto;

  if (currVal.indexOf('.') == -1)
    currValFound = true;

  fldEndp.options.length = 0;

  endpointTypes = {};
  swapnet.status.forEach(function(endpoint)
  {
    var endp = endpoint.location + "." + endpoint.name;

    if (!currValFound)
    {
      if (endp == currVal)
        currValFound = true;
    }
    fldEndp.options[fldEndp.options.length] = new Option(endp, endp);
    
    endpointTypes[endp] = endpoint.type;
  });

  if (!currValFound)
  {
    fldEndp.options[fldEndp.options.length] = new Option(currVal, "");
    endpointTypes[currVal] = "num";
  }

  fldEndp.value = currVal;

  onchangeEndp();
}

/**
 * Lagarto server selected
 */
function onchangeServer()
{
  var server = document.getElementById("server").value;
  var dot = statement[3].indexOf('.');

  if (server != "")
    loadJSONdata("/command/get_endpoint_list/?server=" + server, fillEndpoints);
  else if (dot == -1)
  {
    var currVal = statement[3].substring(dot+1);
    var fldEndp = document.getElementById("endp");
    fldEndp.options.length = 0;
    fldEndp.options[fldEndp.options.length] = new Option(currVal, "");
  }
}

/**
 * Endpoint selected
 */
function onchangeEndp()
{
  var endp = document.getElementById("endp").value;
  statement[1] = document.getElementById("server").value + "." + endp;
  var endpType = getEndpointType(endp);

  var end = statement[3].indexOf(".");
  if (end > -1)
  {
    if (statement[3].substring(0, end) in servers)
    {
      document.getElementById("item2box").src = "../edit_item2_network.html";
      return;
    }
  }

  if (endpType == "bin")
	  document.getElementById("item2box").src = "../edit_item2_state.html";
  else
    document.getElementById("item2box").src = "../edit_item2_val.html";
  onchangeOperator();
}

/**
 * Operator selected
 */
function onchangeOperator()
{
  var operator = document.getElementById("operator").value;

  if (operator == "on change")
    document.getElementById("item2box").src = "../edit_item2_void.html";
}

/**
 * Return python representation of the network condition
 */
function getCondition()
{
  var i = document.getElementById("server").selectedIndex;
  if (i == -1)
    return null;
  var server = document.getElementById("server").options[i].text;
  var operator = document.getElementById("operator").value;
  var pythonString = null;
  var item1 = "\"" + server + "." + document.getElementById("endp").value + "\"";
  var item2box = document.getElementById("item2box").contentWindow;
  var item2 = null;

  if (typeof item2box.getItem2 == 'function')
    item2 = item2box.getItem2();

  if (statementType == "trigger")
  {
    if (operator == "on change")
      pythonString = "network.event[0] == " + item1;
    else if (item2 != null)
      pythonString = "network.event[0] == " + item1 + " and network.event[1] " + operator + " " + item2;
  }
  else if (item2 != null)
    pythonString = "network.get_value(" +  item1 + ") " + operator + " " + item2;

  return pythonString;
}

/**
 * Return list of servers
 */
function getServers()
{
  var server = document.getElementById("server");

  return server.options;
}

/**
 * Return type of the endpoint currently selected
 */
function getEndpointType()
{
  return endpointTypes[document.getElementById("endp").value];
}
