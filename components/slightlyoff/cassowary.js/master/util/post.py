import httplib, urllib, fileinput

if __name__ == "__main__":
  params = urllib.urlencode({
    "js_code": ''.join([ line for line in fileinput.input() ])
  })
  headers = {
    "Content-type": "application/x-www-form-urlencoded",
    "Accept": "text/plain"
  }
  conn = httplib.HTTPConnection("marijnhaverbeke.nl")
  conn.request("POST", "/uglifyjs", params, headers)
  response = conn.getresponse()
  data = response.read()
  print data
  conn.close()
