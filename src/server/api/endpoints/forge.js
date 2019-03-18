///////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2016 - ADN/Developer Technical Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
///////////////////////////////////////////////////////////////////////
import ServiceManager from '../services/SvcManager'
import { OAuth2 } from 'oauth'
import express from 'express'
import config from 'c0nfig'
import { rejects } from 'assert';

module.exports = function() {

  const router = express.Router()

  /////////////////////////////////////////////////////////
  // Initialize OAuth library
  //
  /////////////////////////////////////////////////////////

  const oauth2 = new OAuth2(
    config.forge.oauth.clientId,
    config.forge.oauth.clientSecret,
    config.forge.oauth.baseUri,
    config.forge.oauth.authorizationUri,
    config.forge.oauth.accessTokenUri,
    null)

  /////////////////////////////////////////////////////////
  // login endpoint
  // client/services/forgeSvc中 请求getLoginURL请求的接口
  /////////////////////////////////////////////////////////
  router.post('/login', async(req, res) => {

    req.session.redirect = req.body.origin || '/'

    const authURL = oauth2.getAuthorizeUrl({
      redirect_uri: config.forge.oauth.redirectUri,
      scope: config.forge.oauth.scope.join(' ')
    })

    console.log(`forge.js(后台):/login接口中的authURL: ${authURL}`)

    const forgeSvc = ServiceManager.getService(
      'ForgeSvc')

    const csrf = await forgeSvc.generateCryptoToken()

    req.session.csrf = csrf.replace(/\+/g, ' ')

    res.json(`${authURL}&response_type=code&state=${csrf}`)
  })

  // 注释：myLogin接口，用于替代/login
  router.post('/myLogin', async(req,res) => {
    try{
      const user = req.body;

      let response = {};
      const modelSvc = ServiceManager.getService('users-ModelSvc')

      const password =
        await modelSvc.postMyLogin(user.username)
      console.log(`??????????从数据库中成功取回密码： ${JSON.stringify(password)}`)
      console.log(`??????????前端输入的密码是： ${JSON.stringify(user.password)}`)
      if(user.password == password.password){
        response.success = true;
        req.session.forge = user.username || {};
      }else{
        response.success = false;
      }
      console.log(`????????返回前端的内容为： ${JSON.stringify(response)}`)      
      res.json(response)

      // if (!user) {
      //   res.status(404)
      //   //如果不是用户，显示对应的错误信息
      //   return res.json('用户密码错误')
      // }
      // res.json(user)

    }catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }


  })

  /////////////////////////////////////////////////////////
  // logout endpoint
  //
  /////////////////////////////////////////////////////////
  router.post('/logout', (req, res) => {

    const forgeSvc = ServiceManager.getService(
      'ForgeSvc')

    forgeSvc.logout(req.session)

    res.json('success')
  })

  /////////////////////////////////////////////////////////
  // GET /clientId
  // Get Forge app clientId
  //
  /////////////////////////////////////////////////////////
  router.get('/clientId', async (req, res) => {

    try {

      const forgeSvc = ServiceManager.getService(
        'ForgeSvc')

      console.log("router.get方法中的forgeSvc.clientId： "+forgeSvc.clientId)

      const expire = new Date(Date.now() + 2592000000).toUTCString()

      res.setHeader('Cache-Control', 'public, max-age=2592000')
      res.setHeader('Expires', expire)

      res.json({
        clientId: forgeSvc.clientId
      })
``
    } catch (ex) {

      res.status(ex.status || 500)
      res.json(ex)
    }
  })

  /////////////////////////////////////////////////////////
  // GET /user
  // Get current user
  //
  /////////////////////////////////////////////////////////
  router.get('/user', async (req, res) => {

    try {

      //验证 前端请求了/user接口到了这里
      console.log(`》》》》》》》》》》》得到了/user的req请求（后台）`)

      const userSvc = ServiceManager.getService(
        'UserSvc')
      console.log(`打印出forge.js ServiceManager.getService('UserSvc')： ${JSON.stringify(userSvc)}`)

      //getCurrentUser返回了resolve(null)，因为session没有forge字段，仅有cookie
      //session={"cookie":{"originalMaxAge":86400000,"expires":"2018-11-01T12:06:47.615Z","secure":false,"httpOnly":true,"path":"/"}}
      // console.log(`req.session: ${JSON.stringify(req.session)}`)
      const user = await userSvc.getCurrentUser(
        req.session)

      console.log(`》》》》》》》userSvc.getCurrentUser的返回值（user）： ${JSON.stringify(user)}`)

      if (!user) {
        res.status(404)
        //如果不是用户，显示对应的错误信息
        return res.json('Not Found =>结果为！user，原因是req.session没有forge')
      }

      res.json(user)

    } catch (ex) {

      res.status(ex.status || 404)
      res.json(ex)
    }
  })

  /////////////////////////////////////////////////////////
  // Reply looks as follow:
  //
  //  access_token: "...",
  //  refresh_token: "...",
  //  results: {
  //    token_type: "Bearer",
  //    expires_in: 86399,
  //    access_token: "..."
  //  }
  //
  /////////////////////////////////////////////////////////
  router.get('/callback/oauth', (req, res) => {

    const csrf = req.query.state

    if (csrf !== req.session.csrf) {

      return res.status(401).end()
    }

    // filter out errors (access_denied, ...)
    if (req.query && req.query.error) {

      return res.redirect(req.session.redirect)
    }

    if (!req.query || !req.query.code) {

      return res.redirect(req.session.redirect)
    }


    oauth2.getOAuthAccessToken(
      req.query.code, {
        grant_type: 'authorization_code',
        redirect_uri: config.forge.oauth.redirectUri
      },
      async(err, access_token, refresh_token, results) => {

        try {

          if (err) {

            return res.redirect(req.session.redirect)
          }

          const forgeSvc = ServiceManager.getService(
            'ForgeSvc')

          const token = {
            scope: config.forge.oauth.scope,
            expires_in: results.expires_in,
            refresh_token: refresh_token,
            access_token: access_token
          }

          forgeSvc.set3LeggedTokenMaster(
            req.session, token)

          //const user = await forgeSvc.getUser(req.session)
          //
          //const userSvc = ServiceManager.getService(
          //  'UserSvc')

          // GDPR Modification
          //await userSvc.save(user)

          res.redirect(req.session.redirect)

        } catch (ex) {

          res.redirect(req.session.redirect)
        }
      })
  })

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  router.post('/callback/hooks', async (req, res) => {

    const socketSvc = ServiceManager.getService(
      'SocketSvc')

    const userId = req.body.hook.createdBy

    socketSvc.broadcastToUser(
      userId, 'forge.hook', req.body)

    res.status(200).end()
  })

  /////////////////////////////////////////////////////////
  // 3-legged token
  //
  /////////////////////////////////////////////////////////
  router.get('/token/3legged', async (req, res) => {

    const forgeSvc = ServiceManager.getService(
      'ForgeSvc')

    try {

      const scope = [
        'viewables:read',
        'data:write',
        'data:read'
      ]

      const token =
        await forgeSvc.get3LeggedTokenClient(
          req.session, scope)

      res.json({
        expires_in: forgeSvc.getExpiry(token),
        access_token: token.access_token,
        scope: token.scope
      })

    } catch (error) {

      console.log(error)
      res.status(error.statusCode || 500)
      res.json(error)
    }
  })

  /////////////////////////////////////////////////////////
  // 2-legged token
  //
  /////////////////////////////////////////////////////////
  router.get('/token/2legged', async (req, res) => {

    const forgeSvc = ServiceManager.getService(
      'ForgeSvc')

    try {

      const token =
        await forgeSvc.request2LeggedToken(
          'viewables:read')

      res.json(token)

    } catch (error) {

      res.status(error.statusCode || 500)
      res.json(error)
    }
  })

  return router
}
