import { it, describe } from "mocha"
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
chai.should();

chai.use(chaiHttp)


// describe('brew', () => {

//     it('should serve GET', (done) => {
//         chai.request('http://localhost')
//             .get('/api/Probe/doSomething?stringValue=12345&numberValue=500')
//             .end((err, res) => {
//                 if (!err) {
//                     expect(res.body.toString()).to.be.equal([
//                         "The",
//                         "Thing",
//                         "12345",
//                         "500"
//                     ].toString());
//                 };
//                 done(err);
//             });
//     });


// });