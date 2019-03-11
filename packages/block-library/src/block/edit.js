/**
 * External dependencies
 */
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BlockEditorProvider } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ReusableBlockEditPanel from './edit-panel';
import ReusableBlockIndicator from './indicator';
import { parse, serialize } from 'path';

class ReusableBlockEdit extends Component {
	constructor( { reusableBlock } ) {
		super( ...arguments );

		this.startEditing = this.startEditing.bind( this );
		this.stopEditing = this.stopEditing.bind( this );
		this.setBlocks = this.setBlocks.bind( this );
		this.setTitle = this.setTitle.bind( this );
		this.save = this.save.bind( this );

		if ( reusableBlock && reusableBlock.isTemporary ) {
			// Start in edit mode when we're working with a newly created reusable block
			this.state = {
				isEditing: true,
				title: reusableBlock.title,
				blocks: [],
			};
		} else {
			// Start in preview mode when we're working with an existing reusable block
			this.state = {
				isEditing: false,
				title: null,
				blocks: [],
			};
		}
	}

	componentDidMount() {
		if ( ! this.props.reusableBlock ) {
			this.props.fetchReusableBlock();
		}
	}

	startEditing() {
		const { reusableBlock } = this.props;

		this.setState( {
			isEditing: true,
			title: reusableBlock.title,
			blocks: parse( reusableBlock.content ),
		} );
	}

	stopEditing() {
		this.setState( {
			isEditing: false,
			title: null,
			blocks: [],
		} );
	}

	setBlocks( blocks ) {
		this.setState( { blocks } );
	}

	setTitle( title ) {
		this.setState( { title } );
	}

	save() {
		const { onChange, onSave } = this.props;
		const { blocks, title } = this.state;
		const content = serialize( blocks );
		onChange( { title, content } );
		onSave();

		this.stopEditing();
	}

	render() {
		const { isSelected, reusableBlock, isFetching, isSaving, canUpdateBlock, settings } = this.props;
		const { isEditing, title, blocks } = this.state;

		if ( ! reusableBlock && isFetching ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		if ( ! reusableBlock ) {
			return <Placeholder>{ __( 'Block has been deleted or is unavailable.' ) }</Placeholder>;
		}

		let element = (
			<BlockEditorProvider
				settings={ settings }
				value={ blocks }
				onChange={ this.setBlocks }
				onInput={ this.setBlocks }
			>
				<div>test sdfsdf sdf sdf</div>
			</BlockEditorProvider>
		);

		if ( ! isEditing ) {
			element = <Disabled>{ element }</Disabled>;
		}

		return (
			<>
				{ ( isSelected || isEditing ) && (
					<ReusableBlockEditPanel
						isEditing={ isEditing }
						title={ title !== null ? title : reusableBlock.title }
						isSaving={ isSaving && ! reusableBlock.isTemporary }
						isEditDisabled={ ! canUpdateBlock }
						onEdit={ this.startEditing }
						onChangeTitle={ this.setTitle }
						onSave={ this.save }
						onCancel={ this.stopEditing }
					/>
				) }
				{ ! isSelected && ! isEditing && <ReusableBlockIndicator title={ reusableBlock.title } /> }
				{ element }
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const {
			__experimentalGetReusableBlock: getReusableBlock,
			__experimentalIsFetchingReusableBlock: isFetchingReusableBlock,
			__experimentalIsSavingReusableBlock: isSavingReusableBlock,
		} = select( 'core/editor' );
		const { canUser } = select( 'core' );
		const {
			__experimentalGetParsedReusableBlock,
			getSettings,
		} = select( 'core/block-editor' );
		const { ref } = ownProps.attributes;
		const reusableBlock = getReusableBlock( ref );

		return {
			reusableBlock,
			isFetching: isFetchingReusableBlock( ref ),
			isSaving: isSavingReusableBlock( ref ),
			blocks: reusableBlock ? __experimentalGetParsedReusableBlock( reusableBlock.id ) : null,
			canUpdateBlock: !! reusableBlock && ! reusableBlock.isTemporary && !! canUser( 'update', 'blocks', ref ),
			settings: getSettings(),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			__experimentalFetchReusableBlocks: fetchReusableBlocks,
			__experimentalUpdateReusableBlock: updateReusableBlock,
			__experimentalSaveReusableBlock: saveReusableBlock,
		} = dispatch( 'core/editor' );
		const { ref } = ownProps.attributes;

		return {
			fetchReusableBlock: partial( fetchReusableBlocks, ref ),
			onChange: partial( updateReusableBlock, ref ),
			onSave: partial( saveReusableBlock, ref ),
		};
	} ),
] )( ReusableBlockEdit );
