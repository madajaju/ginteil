pipeline {
  agent any

  stages {
    stage('Build') {
      steps {
        sh 'npm run-script build'
        sh 'npm run-script deploy-app'
      }
    }
    stage('Test') {
      steps {
        sh 'npm run-script deploy'
        sh 'npm '
      }
    }
  }
}

