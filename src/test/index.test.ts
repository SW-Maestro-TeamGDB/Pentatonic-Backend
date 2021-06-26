import assert from "assert"
import request from "supertest"
import app from "test"
import { createReadStream } from "fs"
import { join, extname } from "path"
import { contentType } from 'mime-types'

const graphql = (query: string, variables: { [x: string]: any } = {}) => {
    const map = Object.assign({}, Object.keys(variables).map(key => [`variables.${key}`]));
    const response = request(app)
        .post('/api')
        .field('operations', JSON.stringify({ query }))
        .field('map', JSON.stringify(map))

    Object.values(variables).forEach((value, i) => {
        if (contentType(extname(value))) {
            response.attach(`${i}`, value)
        } else {
            response.field(`${i}`, value)
        }
    })
    return response
}


describe(`Server Init Test`, () => {

    it(`Server Running Test-1`, async () => {
        const query = `
            query{
                test
            }
        `
        await request(app)
            .get(`/api?query=${query}`)
            .expect(200)
    })
    it(`Server Running Test-2`, async () => {
        const query = `
            query{
                test1
            }
        `
        const { body } = await request(app)
            .get(`/api?query=${query}`)
            .expect(400)
        assert.strictEqual(body.errors[0].message, 'Cannot query field "test1" on type "Query". Did you mean "test"?')
    })

    it(`Server Running Test-3`, async () => {
        const { body } = await graphql(`
            mutation($file: FileUpload){
                imgUpload(file: $file)
            }
        `, { file: __dirname + '/github_profile.jpeg' })
        assert.strictEqual(body.data.imgUpload, true)
    })
})