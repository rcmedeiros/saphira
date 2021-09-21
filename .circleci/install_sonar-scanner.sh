#!/bin/bash
if [ -d sonar-scanner-4.6.2.2472-linux ]
then
    echo "Sonar Scanner already cached"
else
    curl -o scanner.zip 'https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.6.2.2472-linux.zip'
    mkdir sonar-scanner
    unzip scanner.zip
    chmod +x sonar-scanner-4.6.2.2472-linux/bin/sonar-scanner
fi