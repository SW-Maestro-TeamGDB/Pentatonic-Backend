/**
 * @param {input.cardNumber} 카드번호(dddd-dddd-dddd-dddd)
 * @param {input.expiry} 카드 유효기간(YYYY-MM)
 * @param {input.birth} 생년월일6자리(법인카드의 경우 사업자등록번호10자리)
 * @param {input.buyerName} 구매자명
 * @param {input.buyerEmail} 구매자 이메일
 * @param {input.password2Digit} 비밀번호 앞 2자리
 */
export interface PaymentInput {
    input: {
        cardNumber: string
        expiry: string
        birth: string
        buyerName: string
        buyerEmail: string
        password2Digit: string
    }
}
