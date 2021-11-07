# <b>🎵 Pentatonic-Backend Repository 🎵</b>

<img src="https://penta-tonic.com/static/media/Logo.c2134bc5.png" width="100%" style="border:2px solid #9F81F7; border-radius:25px;">
<br>
<br>

## <b> 🗂️ Contents </b>

-   ### <b> <a href="#0"> 🔗 Team introduce </a> </b>
-   ### <b> <a href="#0.5"> 🔗 Service introduce </a> </b>
-   ### <b> <a href="#1"> 🔗 Other Repositories & page </a> </b>
-   ### <b> <a href="#2"> 🔗 Technology </a> </b>
-   ### <b> <a href="#3"> 🔗 Result </a> </b>
<br>

<hr>
<h2 id="0">
    <b>💁 Team  introduce </b>
</h2>

<br>

<img src="https://cdn.discordapp.com/attachments/843498829781008387/906020785318137926/unknown.png">
<br>

<b>고등학생 대학생 백수가 모여서 만든 팀 고대백 입니다</b>

| Part                 | Name                                                |
| -------------------- | --------------------------------------------------- |
| **Android & Leader** | <a href="https://github.com/H43RO">김현준 </a>      |
| **Back-end**         | <a href="https://github.com/pukuba">남승원 </a>     |
| **Front-end**        | <a href="https://github.com/Jongminfire">이종민</a> |

<br>
<hr>

<h2 id="0.5">
    <b>💁 Service introduce</b>
</h2>

### 시간적 제약, 공간적 제약, 금전적 제약을 해결하며 온라인에서 밴드 활동을 할 수 있는 플랫폼

-   녹음 기반의 밴드 음악 연주 및 커버 플랫폼
-   시간적, 실력적 부담 없이 밴드 음악을 즐길 수 있음
-   다양한 이펙터를 제공함으로 재미있게 커버할 수 있음
-   장비가 없더라도 녹음한 커버에 대하여 각종 정제가 들어가서 장비 없이도 고퀄리티의 녹음이 가능
-   다양한 세션들을 조합하여 리스너의 취향대로 듣기 가능

<br>
<hr>

<h2 id="1">
<b>📘 이곳은 제 12기 SW 마에스트로 고대백 팀 프로젝트 'Pentatonic (펜타토닉)' 의 백엔드 레포지토리 입니다. </b><br>
<br>
<b>📚 Other Repositories & Page</b>
</h2>

-   ## <b> <a href="https://git.swmgit.org/swm-12/12_swm39"> 🔗 Pentatonic-Organization </a> </b>
-   ## <b> <a href="https://git.swmgit.org/swm-12/12_swm39/Pentatonic-Android" > 🔗 Pentatonic-Android </a> </b>
-   ## <b> <a href="https://git.swmgit.org/swm-12/12_swm39/Pentatonic-Web" > 🔗 Pentatonic-Web </a> </b>

<br>
<hr>

<h2 id="2"><b>🗂 Technology</b></h2>

<img src="https://cdn.discordapp.com/attachments/843498829781008387/906422071117119488/unknown.png">

<div style="display: inline-block">

<img src="https://img.shields.io/badge/Docker Swarm-2496ED?logoColor=FFFFFF&logo=docker&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Travis CI-3EAAAF?logoColor=FFFFFF&logo=Travis&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Codecov-F01F7A?logoColor=FFFFFF&logo=Codecov&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Mocha-8D6748?logoColor=FFFFFF&logo=Mocha&style=flat-square"> &nbsp;

<img src="https://img.shields.io/badge/Node.js-339933?logoColor=FFFFFF&logo=Node.js&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/TypeScript-3178C6?logoColor=FFFFFF&logo=TypeScript&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Apollo%20GraphQL-311C87?logoColor=FFFFFF&logo=Apollo%20GraphQL&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/GraphQL-E10098?logoColor=FFFFFF&logo=GraphQL&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Express-000000?logoColor=FFFFFF&logo=express&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/FFmpeg-007808?logoColor=FFFFFF&logo=FFmpeg&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Nginx-009639?logoColor=FFFFFF&logo=Nginx&style=flat-square"> &nbsp;

<img src="https://img.shields.io/badge/Amazon AWS-232F3E?logoColor=FFFFFF&logo=Amazon AWS&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Naver NCP-03C75A?logoColor=FFFFFF&logo=Naver&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Microsoft Azure-0078D4?logoColor=FFFFFF&logo=Microsoft Azure&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Cloudflare-F38020?logoColor=FFFFFF&logo=Cloudflare&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Firebase-FFCA28?logoColor=FFFFFF&logo=Firebase&style=flat-square"> &nbsp;

<img src="https://img.shields.io/badge/MongoDB-47A248?logoColor=FFFFFF&logo=MongoDB&style=flat-square"> &nbsp;
<img src="https://img.shields.io/badge/Redis-DC382D?logoColor=FFFFFF&logo=Redis&style=flat-square"> &nbsp;

Docker Swarm을 이용하여 수평 확장에 쉽도록 설계하였습니다.

Travis CI -> (mocha) Testing -> (nyc coverage) Codecov upload -> Deploy -> Rolling Update와 같은 방식으로 배포합니다.

Web Application Server는 TypeScript, Apollo-Server-Express, FFmpeg 등을 사용하여 개발하였으며 서비스에 맞는 API를 제공해줍니다.

Web Server는 Nginx를 이용하고 있으며 N개의 컨테이너에 도커 스웜 로드밸런서에 따라 요청이 분배됩니다.

</div>

<br>
<br>
<hr>

<h2 id="3"><b>🗂 Result</b></h2>

| CI                                                                                                                                                             | Coverage                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![Build Status](https://travis-ci.com/SW-Maestro-TeamGDB/Pentatonic-Backend.svg?branch=develop)](https://travis-ci.com/SW-Maestro-TeamGDB/Pentatonic-Backend) | [![codecov](https://codecov.io/gh/SW-Maestro-TeamGDB/Pentatonic-Backend/branch/develop/graph/badge.svg?token=20867YLIIY)](https://codecov.io/gh/SW-Maestro-TeamGDB/Pentatonic-Backend) |
|                                                                                                                                                                |

서버, API, 데이터베이스 모니터링을 제공하여 서비스가 안정적으로 운영될 수 있도록 하였습니다.

<img src="https://cdn.discordapp.com/attachments/843498829781008387/906571457268707358/unknown.png">

<br>
<br>

<img src="https://media.discordapp.net/attachments/843498829781008387/906573049900445807/unknown.png?width=1740&height=617">

<br>
<br>

<img src="https://cdn.discordapp.com/attachments/843498829781008387/906574640359571456/unknown.png">

<br>
<br>

Confluence, Apollo-Studio, GraphQL-PlayGround, Voyager 등을 이용하여 API 더욱 쉽게 이해하고 사용할 수 있도록 다양한 문서를 제공해줍니다.

<br>

<img src="https://cdn.discordapp.com/attachments/843498829781008387/906582419891716166/unknown.png">

<br>
<br>

<img src="https://cdn.discordapp.com/attachments/843498829781008387/906583807170334720/unknown.png">
