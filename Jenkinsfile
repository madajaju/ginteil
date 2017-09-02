pipeline {
  agent {
    label 'node'
  }
  stages {
    stage('Build') {
      steps {
        sh 'npm run-script build'
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

