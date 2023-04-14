// https://karino2.github.io/TextTL_site/md/2023/04/13/test.html

// copy from texttl-electron

const path = require('path')
const fs = require('fs/promises')
const {encode} = require('html-entities')


if (process.argv.length != 2) {
  console.log("Usage: index.js")
  console.log(process.argv.length)
  process.exit(1)
}

const g_TEXTTL_DIR = "../../src_text"
const g_OUTPUT_PATH = "../../md"

/*
    patに従うファイル名（0パディングの数字）を数字的に古い順にsortした配列として返す。
*/
const readDirs = async(dirPath, pat) => {
  const dirs = await fs.readdir(dirPath)

  return await Promise.all(
      dirs
      .filter(fname => fname.match(pat))
      .filter( async fname => {
          const full = path.join(dirPath, fname)
          return (await fs.stat(full)).isDirectory()
      } )
      .sort( (a, b) => a > b ? 1 : -1)
      )
}

/*
4桁の数字のdirを数字的に古い順にsortした配列として返す。
*/
const readYears = async(dirPath) => {
  return await readDirs( dirPath, /^[0-9][0-9][0-9][0-9]$/)
}

/*
2桁の数字のdirを数字的に古い順にsortした配列として返す
*/
const readMonths = async(dirPath, yearstr) => {
  const targetDir = path.join(dirPath, yearstr)
  return await readDirs( targetDir, /^[0-9][0-9]$/)
} 

const readDays = async(dirPath, yearstr, monthstr) => {
  const targetDir = path.join(dirPath, yearstr, monthstr)
  return await readDirs( targetDir, /^[0-9][0-9]$/)
}

const readFilePathsAt = async(dirPath, yearstr, monthstr, daystr) => {
  const targetPath = path.join(dirPath, yearstr, monthstr, daystr)
  const files = await fs.readdir(targetPath)
  return files
      .filter( fname => fname.match(/^[0-9]+\.txt$/) )
      .sort( (a, b) => a > b ? 1 : -1)
      .map(fname => { return {fullPath: path.join(targetPath, fname), year:yearstr, month:monthstr, day:daystr, fname: fname} })
}

const readFilePaths = async(dirPath) => {
  const years = await readYears(dirPath)
  let ret = []
  for (const year of years) {
      const months = await readMonths(dirPath, year)
      for (const month of months) {
          const days = await readDays(dirPath, year, month)
          for (const day of days) {
              const cur = await readFilePathsAt(dirPath, year, month, day)
              ret = ret.concat(cur)
          }
      }
  }
  return ret
}

const para2html = (json) => {
  let encoded = encode(json.content)
  let dtstr = json.date.getTime().toString()

  return `---
title: ひとことのpermlink
layout: page
---
<div class="box" dt="${dtstr}">
  ${encoded}
  <div class="content is-small">${json.date}</div>
</div>`
}


const ensureDir = async (dir) => {
  try {
      await fs.access( dir, fs.constants.R_OK | fs.constants.W_OK )
  }
  catch(error) {
      await fs.mkdir( dir, { recursive: true } )
  }
}

const toYMDDir = (year, month, day) => {
  return path.join(g_OUTPUT_PATH, year, month, day)
}

const processDir = async (dirPath) => {
  const paths = await readFilePaths(dirPath)
  const cont = await Promise.all(
      paths
      .map( async pathtuple => {
          const basename = pathtuple.fname.substring(0, pathtuple.fname.length - 4)
          const date = new Date(parseInt(basename))
          const content = await fs.readFile(pathtuple.fullPath)
          const htmlcontent = para2html({date: date, content: content})
          const targetDir = toYMDDir(pathtuple.year, pathtuple.month, pathtuple.day )
          await ensureDir(targetDir)
          await fs.writeFile(path.join(targetDir, `${basename}.md`), htmlcontent)
          return ""
      })
  )
  return cont
}

(async function(){
  await processDir(g_TEXTTL_DIR)
})()
