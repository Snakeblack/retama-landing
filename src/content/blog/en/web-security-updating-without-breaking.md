---
key: web-security-updates
title: "Web security: updating without breaking"
description: What happened this year with PHP, Java and Node, why an application nobody touches is not safe, and how we update ours without changing what they do.
published: 2026-10-28
updated: 2026-10-30
---

On 21 October 2026, PHP and Node.js both released fixes for serious flaws. Back in August, CISA, the United States cybersecurity agency, had warned that attackers were exploiting a flaw in Apache Tomcat, the server that runs many applications written in Java. If your business uses a web application, it most likely runs on one of the three.

These flaws sit in the parts that applications are built on. That is why an application nobody touches grows more exposed over time, even if it works just as it did on day one.

## PHP: a flaw in every server

The two flaws, known as “php2shell” (CVE-2026-109618 and CVE-2026-109619), affect any PHP installation that serves web pages. Whoever exploits them can run their own programs on the server without a username or password. PHP fixed them in versions 8.5.12, 8.4.27, 8.3.36 and 8.2.35, and on 26 October CISA [confirmed that they are being used in attacks](https://www.cisa.gov/news-events/alerts/2026/10/21/critical-vulnerabilities-php-require-immediate-patching).

Old versions are the worst off. PHP 8.1 and earlier no longer get fixes, and CISA advises taking those servers offline until they can be updated. A website that has gone years without maintenance is probably in that group.

## Java: the fix came four months before the warning

In March, Apache Tomcat fixed a flaw in the component that encrypts messages between servers working as a group. That fix had a flaw of its own (CVE-2026-34486), which [was fixed in early April](https://tomcat.apache.org/security-11.html). On 4 August, CISA [added it to its list of flaws exploited in real attacks](https://www.cisa.gov/news-events/alerts/2026/08/04/cisa-adds-three-known-exploited-vulnerabilities-catalog).

Anyone who installed the April fix had been protected for four months when the warning came. Anyone who stopped at the March fix believed they were up to date, but had the new flaw.

## Node.js: risk also comes in through packages

On 21 October, Node.js [fixed ten flaws](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) in its versions 22, 24 and 26. The most serious (CVE-2026-111497) is in the code that decompresses Brotli data, a compression format widely used on the web: specially crafted data can corrupt the program's memory and even run code. Node.js 20 no longer gets these fixes.

Node also carries a second risk, and it grows every year: packages. A typical application uses hundreds of pieces of other people's code, downloaded from npm, the public registry of JavaScript packages. Whoever takes over the account of someone who publishes one of them can upload a rigged version, and whoever installs it brings it onto their own machine.

- **On 31 March it was the turn of axios**, a package downloaded more than 100 million times a week. The attacker tricked their way into its lead maintainer's computer and published two versions that installed a program to control the machine remotely. [They were available for about three hours](https://github.com/axios/axios/issues/10636).
- **In August came “ChainDrop”**, a program that steals developers' credentials and uses them to infect other packages. According to the [advisory from Singapore's cybersecurity agency](https://www.csa.gov.sg/alerts-and-advisories/advisories/ad-2026-009/), it affected more than 1,300 package versions.

## Falling behind or updating blindly

One risk is falling behind: a server on PHP 8.1, or a Tomcat with the March fix. The other is updating blindly: whoever installed axios during those three hours got the problem precisely because they were up to date.

The same method avoids both: update often, in fixed steps, and in no hurry for whatever was just released.

## How we do it at Retama

This is what we do in everything we build and maintain, starting with this website. It is also what our monthly maintenance includes, from €120 for [a website](/en/services/websites-and-cms/) and €250 for custom software, excluding VAT.

- **We keep the exact list of what each application contains.** Every project records the version of each package, so what we test is exactly what goes live.
- **We check it every day against known flaws.** An automatic review compares it with the public databases of security flaws every day and on every change, and tells us as soon as one appears.
- **We do not install what was just published.** A new version does not get in until it has been out for at least a day. The axios ones were pulled after three hours, well within that wait.
- **Packages run nothing when they are installed.** Only a short list we have reviewed may do so. That is exactly how the axios trap went off: when the package was installed.
- **Tests decide.** Every update goes through automated tests that check the application still does the same thing. Some check its rules one by one, and others go through its screens in a real browser. If something changes, the update does not go live until we know why.
- **Little by little.** We update often and in small changes, so we know what caused any difference and can undo that change.

None of this makes a flaw impossible, but it does get fixes to you early and checked, with no change to what your team uses every day.

## If you already have an application

Ask whoever maintains it:

- Which version of PHP, Java or Node does it run on, and until when will it get fixes?
- When were its packages last updated?
- Who finds out when a serious flaw comes out, and how long does it take to apply the fix?
- Are there automated tests that check everything still works the same after an update?

If any of these has no clear answer, it is worth looking into before the next warning comes out.
