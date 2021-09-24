import env from "dotenv"
env.config()

import { NodeSSH } from "node-ssh"

const ssh = new NodeSSH()

const deploy = async () => {
    await ssh.connect({
        host: process.env.HOST,
        username: process.env.ID,
        password: process.env.PW,
    })
    await ssh.execCommand(`./deploy.sh`)
    process.exit(0)
}
deploy()
