// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/// @title IERC721AntiSpam
/// @dev 詐欺防止機能付きコントラクトのインターフェース
/// @author hayatti.eth

interface IERC721AntiSpam {

    /**
     * @dev 個別ロックが指定された場合のイベント
     */
    event Lock (address indexed unlocker, uint256 indexed id);

    /**
     * @dev 個別アンロックが指定された場合のイベント
     */
    event Unlock (uint256 indexed id);

    /**
     * @dev 個別のトークンIDをロックする場合の関数。
     */
    function lock(uint256 id) external;

    /**
     * @dev 個別のトークンIDをアンロックする場合の関数
     */
    function unlock(uint256 id) external;

    /**
     * @dev 該当トークンIDにおいて、コントラクトロック機能が働いているかどうかを return で返す。
     */
    function getLocked(uint256 tokenId) external view returns (bool);

    /**
     * @dev CALを利用するかどうかを設定する。falseの場合はCALを利用しない。trueの場合はCALを利用する。
     */
    function setUseContractAllowList(bool _state) external;

    /**
     * @dev CALのリストに無い独自の許可アドレスを設定する場合、こちらに許可アドレスを記載する。
     */
    function setUseContractAllowList(address _contract, bool _state) external;


    /**
     * @dev CALを利用する場合のCALのレベルを設定する。レベルが高いほど、許可されるコントラクトの範囲が狭い。
     */
    function setContractAllowListLevel(uint256 _value) external;

}