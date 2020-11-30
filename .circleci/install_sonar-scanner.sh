#!/bin/bash
if [ -d sonar-scanner-4.5.0.2216-linux ]
then
    echo "Sonar Scanner already cached"
else
    curl -o scanner.zip 'https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-4.5.0.2216-linux.zip'
    mkdir sonar-scanner
    unzip scanner.zip
    chmod +x sonar-scanner-4.5.0.2216-linux/bin/sonar-scanner
fi