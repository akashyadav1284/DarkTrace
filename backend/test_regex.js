const re = /\[\*\*\] \[\d+:(\d+):\d+\] (.*?) \[\*\*\] .*? \[Priority: (\d+)\] \{\w+\} ([\d\.]+)[:\d]* -> ([\d\.]+)[:\d]*/;
const str = "[**] [1:1000001:1] Possible SQL Injection [**] [Classification: Attempted Information Leak] [Priority: 1] {TCP} 192.168.1.1:1234 -> 10.0.0.5:80";
console.log(str.match(re));
