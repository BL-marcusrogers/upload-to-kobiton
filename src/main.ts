import * as core from '@actions/core'
import * as request from 'request-promise-native'
import {promises as fs} from 'fs'

async function run(): Promise<void> {
  try {
    const baseUri = 'https://api.kobiton.com/v1'
    const key = Buffer.from(
      `${core.getInput('kobitonLogin')}:${core.getInput('kobitonKey')}`
    ).toString('base64')
    const body = {
      filename: core.getInput('fileName'),
      appId: core.getInput('appId')
    }
    const headers = {
      Authorization: `Basic ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
    const options = {
      uri: `${baseUri}/apps/uploadUrl`,
      headers,
      json: body
    }

    core.info(`Uploading to ${baseUri}`)
    core.info(`Uploading app version with filename ${core.getInput('fileName')} and app id ${core.getInput('appId')} and artifactPath ${core.getInput('artifactPath')}`)
    const {appPath, url: uploadUrl} = await request.post(options)
    core.info(`Response variables appPath ${appPath} and uploadUrl ${uploadUrl}`)

    core.info('About to put file')
    await request.put({
      uri: uploadUrl,
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-amz-tagging': 'unsaved=true'
      },
      body: await fs.readFile(core.getInput('artifactPath'))
    })
    core.info('File uploaded')

    core.info('About to post version')
    const {appId, versionId} = await request.post({
      uri: `${baseUri}/apps`,
      headers,
      json: {appPath, filename: core.getInput('fileName')}
    })
    core.info(`Kobiton notified about new version - appId ${appId} and versionId ${versionId}`)

    core.setOutput('versionId', versionId)
  } catch (error) {
    core.setFailed(JSON.stringify(error))
  }
}

run()
